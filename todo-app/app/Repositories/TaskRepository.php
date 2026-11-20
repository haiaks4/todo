<?php

namespace App\Repositories;

use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Support\Recurrence;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TaskRepository implements TaskRepositoryInterface
{
    /** タスクと一緒に返す関連データ */
    public const RELATIONS = ['tag', 'subtasks', 'project:id,name'];

    public function listByUser(User $user, array $filters): Collection
    {
        $query = $user->tasks()->with(self::RELATIONS);
        $this->applySort($query, $filters['sort'] ?? 'manual');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // プロジェクト（none はプロジェクトに入っていないタスク＝インボックス）
        if (($filters['project_id'] ?? null) === 'none') {
            $query->whereNull('project_id');
        } elseif (!empty($filters['project_id'])) {
            $query->where('project_id', $filters['project_id']);
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

    /**
     * 並べ替え。同じ値のタスクは手動の並び順（order）で並べる。
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Task>|\Illuminate\Database\Eloquent\Relations\HasMany<Task, User>  $query
     */
    private function applySort($query, string $sort): void
    {
        match ($sort) {
            // 期限が近い順（期限なしは最後）
            'due_date' => $query->orderByRaw('due_date IS NULL')->orderBy('due_date'),
            // 優先度が高い順（未設定は最後）。同じ優先度なら期限が近い順
            'priority' => $query
                ->orderByRaw("CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END")
                ->orderByRaw('due_date IS NULL')
                ->orderBy('due_date'),
            // 作成日が新しい順
            'created_at' => $query->orderByDesc('created_at')->orderByDesc('id'),
            default => null,
        };

        $query->orderBy('order')->orderBy('id');
    }

    public function create(User $user, array $data): Task
    {
        return DB::transaction(function () use ($user, $data) {
            $data['order'] = $this->maxOrder($user) + 1;
            $data['status'] = $data['status'] ?? 'todo';

            return $user->tasks()->create($data)->load(self::RELATIONS);
        });
    }

    public function update(Task $task, array $data): Task
    {
        DB::transaction(function () use ($task, $data) {
            $task->fill($data);

            if ($task->isDirty('status') && $task->status === 'done') {
                $this->advanceIfRecurring($task);
            }

            $task->save();
        });

        return $task->fresh(self::RELATIONS);
    }

    /**
     * 繰り返しタスクを完了にしたときは、完了にせず次の期限に進めて未着手に戻す。
     * チェックリストのチェックも外す。
     */
    private function advanceIfRecurring(Task $task): void
    {
        if ($task->recurrence === null || $task->due_date === null) {
            return;
        }

        $task->due_date = Recurrence::next($task->due_date, $task->recurrence);
        $task->status = 'todo';
        $task->subtasks()->update(['is_done' => false]);
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }

    public function bulkDelete(User $user, array $ids): void
    {
        $user->tasks()->whereIn('id', $ids)->delete();
    }

    public function restore(User $user, array $ids): void
    {
        // 削除前の order を保持しているので、元の位置に戻る
        $user->tasks()->onlyTrashed()->whereIn('id', $ids)->restore();
    }

    public function trashed(User $user): Collection
    {
        return $user->tasks()
            ->onlyTrashed()
            ->with(self::RELATIONS)
            ->orderByDesc('deleted_at')
            ->orderByDesc('id')
            ->get();
    }

    public function forceDelete(User $user, array $ids): void
    {
        // チェックリストは外部キーの cascade で一緒に消える
        $user->tasks()->onlyTrashed()->whereIn('id', $ids)->forceDelete();
    }

    public function emptyTrash(User $user): int
    {
        return $user->tasks()->onlyTrashed()->forceDelete();
    }

    public function purgeTrashedBefore(\DateTimeInterface $before): int
    {
        $count = 0;
        Task::onlyTrashed()
            ->where('deleted_at', '<', $before)
            ->chunkById(500, function ($tasks) use (&$count) {
                $count += Task::onlyTrashed()->whereKey($tasks->modelKeys())->forceDelete();
            });

        return $count;
    }

    public function bulkUpdateStatus(User $user, array $ids, string $status): void
    {
        DB::transaction(function () use ($user, $ids, $status) {
            $advancedIds = [];

            if ($status === 'done') {
                $recurring = $user->tasks()
                    ->whereIn('id', $ids)
                    ->where('status', '!=', 'done')
                    ->whereNotNull('recurrence')
                    ->whereNotNull('due_date')
                    ->get();

                foreach ($recurring as $task) {
                    $this->advanceIfRecurring($task);
                    $task->save();
                    $advancedIds[] = $task->id;
                }
            }

            $user->tasks()
                ->whereIn('id', array_diff($ids, $advancedIds))
                ->update(['status' => $status]);
        });
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

    private function maxOrder(User $user): int
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

            // チェック項目も、チェックを外した状態で複製する
            foreach ($task->subtasks as $subtask) {
                $newTask->subtasks()->create([
                    'title'   => $subtask->title,
                    'is_done' => false,
                    'order'   => $subtask->order,
                ]);
            }

            return $newTask->load(self::RELATIONS);
        });
    }
}
