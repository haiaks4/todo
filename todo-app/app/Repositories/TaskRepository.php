<?php

namespace App\Repositories;

use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Support\Collection;

class TaskRepository implements TaskRepositoryInterface
{
    public function listByUser(User $user, array $filters): Collection
    {
        $query = $user->tasks()->with('tag')->orderBy('order');

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
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
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
        $data['order'] = $this->maxOrder($user) + 1;
        $data['status'] = $data['status'] ?? 'todo';

        return $user->tasks()->create($data);
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
        foreach ($ids as $index => $id) {
            $user->tasks()->where('id', $id)->update(['order' => $index]);
        }
    }

    public function maxOrder(User $user): int
    {
        return (int) $user->tasks()->max('order');
    }

    public function duplicate(Task $task): Task
    {
        $newTask = $task->replicate(['order']);
        $newTask->title  = $task->title . ' のコピー';
        $newTask->status = 'todo';
        $newTask->order  = $this->maxOrder($task->user) + 1;
        $newTask->save();

        return $newTask->load('tag');
    }
}
