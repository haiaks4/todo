<?php

namespace App\Repositories;

use App\Models\Subtask;
use App\Models\Task;
use App\Repositories\Contracts\SubtaskRepositoryInterface;
use Illuminate\Support\Facades\DB;

class SubtaskRepository implements SubtaskRepositoryInterface
{
    public function create(Task $task, string $title): Subtask
    {
        return DB::transaction(function () use ($task, $title) {
            // 末尾に追加する
            $order = (int) $task->subtasks()->lockForUpdate()->max('order') + 1;

            return $task->subtasks()->create(['title' => $title, 'order' => $order]);
        });
    }

    public function update(Subtask $subtask, array $data): Subtask
    {
        $subtask->update($data);

        return $subtask;
    }

    public function delete(Subtask $subtask): void
    {
        $subtask->delete();
    }
}
