<?php

namespace App\Repositories\Contracts;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Collection;

interface ProjectRepositoryInterface
{
    /** 作った順に並べ、未完了のタスク数（active_tasks_count）を付けて返す */
    public function listByUser(User $user): Collection;

    public function create(User $user, array $data): Project;

    public function update(Project $project, array $data): Project;

    /** 削除する。中のタスクはインボックス（プロジェクトなし）に移す */
    public function delete(Project $project): void;
}
