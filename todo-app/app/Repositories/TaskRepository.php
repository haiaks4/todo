<?php

namespace App\Repositories;

use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TaskRepository implements TaskRepositoryInterface
{
    public function listByUser(User $user, array $filters): Collection
    {
        $query = $user->tasks()->with('tag')->orderBy('order')->orderBy('id');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['tag_id'])) {
            $query->where('tag_id', $filters['tag_id']);
        }

        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (!empty($filters['search'])) {
            // LIKE のワイルドカード文字（% _）を文字列として扱うためにエスケープする。
            // MySQL / SQLite の双方で動作するようエスケープ文字には '!' を使用する。
            $pattern = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], (string) $filters['search']) . '%';
            $query->where(function ($q) use ($pattern) {
                $q->whereRaw("title LIKE ? ESCAPE '!'", [$pattern])
                  ->orWhereRaw("description LIKE ? ESCAPE '!'", [$pattern]);
            });
        }

        return $query->get();
    }

    public function findById(int $id): Task
    {
        return Task::findOrFail($id);
    }

    public function create(User $user, array $data): Task
    {
        return DB::transaction(function () use ($user, $data) {
            $data['order'] = $this->maxOrder($user) + 1;
            $data['status'] = $data['status'] ?? 'todo';

            return $user->tasks()->create($data)->load('tag');
        });
    }

    public function update(Task $task, array $data): Task
    {
        $task->update($data);

        return $task->fresh('tag');
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }

    public function bulkDelete(User $user, array $ids): void
    {
        $user->tasks()->whereIn('id', $ids)->delete();
    }

    public function reorder(User $user, array $ids): void
    {
        // フィルター中など一部のタスクだけが並び替えられた場合でも、
        // 他のタスクとの相対順序を崩さないよう、対象タスクが元々持っていた
        // order の値の集合を新しい並び順に割り当て直す。
        DB::transaction(function () use ($user, $ids) {
            $tasks = $user->tasks()->whereIn('id', $ids)->lockForUpdate()->get(['id', 'order']);

            $slots = $tasks->sortBy([['order', 'asc'], ['id', 'asc']])->pluck('order')->values();

            // 既存の order が重複している場合は連番に振り直す
            if ($slots->unique()->count() !== $slots->count()) {
                $base = (int) $slots->min();
                $slots = $slots->keys()->map(fn ($i) => $base + $i);
            }

            $existingIds = $tasks->pluck('id')->all();
            $position = 0;

            foreach ($ids as $id) {
                if (! in_array((int) $id, $existingIds, true)) {
                    continue;
                }

                $user->tasks()->whereKey($id)->update(['order' => $slots[$position++]]);
            }
        });
    }

    public function maxOrder(User $user): int
    {
        return (int) $user->tasks()->max('order');
    }

    public function duplicate(Task $task): Task
    {
        return DB::transaction(function () use ($task) {
            $newTask = $task->replicate(['order']);
            $newTask->title  = mb_strimwidth($task->title . ' のコピー', 0, 255);
            $newTask->status = 'todo';
            $newTask->order  = $this->maxOrder($task->user) + 1;
            $newTask->save();

            return $newTask->load('tag');
        });
    }
}
