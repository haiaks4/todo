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

    /** ごみ箱（論理削除したタスク）の一覧。削除が新しい順 */
    public function trashed(User $user): Collection;

    /** ごみ箱のタスクを完全に削除する */
    public function forceDelete(User $user, array $ids): void;

    /** ごみ箱を空にする。消した件数を返す */
    public function emptyTrash(User $user): int;

    /** 削除してから一定期間たったタスクを完全に削除する（全ユーザー）。消した件数を返す */
    public function purgeTrashedBefore(\DateTimeInterface $before): int;

    public function bulkUpdateStatus(User $user, array $ids, string $status): void;

    public function reorder(User $user, array $ids): void;

    public function duplicate(Task $task): Task;
}
