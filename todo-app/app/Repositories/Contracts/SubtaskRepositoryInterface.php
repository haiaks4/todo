<?php

namespace App\Repositories\Contracts;

use App\Models\Subtask;
use App\Models\Task;

interface SubtaskRepositoryInterface
{
    public function create(Task $task, string $title): Subtask;

    public function update(Subtask $subtask, array $data): Subtask;

    public function delete(Subtask $subtask): void;
}
