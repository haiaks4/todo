<?php

namespace App\Repositories\Contracts;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;

interface TaskRepositoryInterface
{
    public function listByUser(User $user, array $filters): Collection;

    public function create(User $user, array $data): Task;

    public function update(Task $task, array $data): Task;

    public function delete(Task $task): void;

    public function bulkDelete(User $user, array $ids): void;

    public function restore(User $user, array $ids): void;

    public function bulkUpdateStatus(User $user, array $ids, string $status): void;

    public function reorder(User $user, array $ids): void;

    public function duplicate(Task $task): Task;
}
