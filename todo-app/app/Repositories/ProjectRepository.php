<?php

namespace App\Repositories;

use App\Models\Project;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProjectRepository implements ProjectRepositoryInterface
{
    public function listByUser(User $user): Collection
    {
        return $user->projects()
            ->withCount(['tasks as active_tasks_count' => fn ($q) => $q->where('status', '!=', 'done')])
            ->orderBy('order')
            ->orderBy('id')
            ->get();
    }

    public function create(User $user, array $data): Project
    {
        return DB::transaction(function () use ($user, $data) {
            $data['order'] = (int) $user->projects()->lockForUpdate()->max('order') + 1;

            return $user->projects()->create($data)->loadCount([
                'tasks as active_tasks_count' => fn ($q) => $q->where('status', '!=', 'done'),
            ]);
        });
    }

    public function update(Project $project, array $data): Project
    {
        $project->update($data);

        return $project->loadCount([
            'tasks as active_tasks_count' => fn ($q) => $q->where('status', '!=', 'done'),
        ]);
    }

    public function delete(Project $project): void
    {
        // 外部キーの ON DELETE SET NULL に頼らず、ごみ箱のタスクも含めて明示的に外す
        DB::transaction(function () use ($project) {
            $project->tasks()->withTrashed()->update(['project_id' => null]);
            $project->delete();
        });
    }
}
