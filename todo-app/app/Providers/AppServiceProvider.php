<?php

namespace App\Providers;

use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\SubtaskRepositoryInterface;
use App\Repositories\Contracts\TagRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Repositories\ProjectRepository;
use App\Repositories\SubtaskRepository;
use App\Repositories\TagRepository;
use App\Repositories\TaskRepository;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(TaskRepositoryInterface::class, TaskRepository::class);
        $this->app->bind(TagRepositoryInterface::class, TagRepository::class);
        $this->app->bind(SubtaskRepositoryInterface::class, SubtaskRepository::class);
        $this->app->bind(ProjectRepositoryInterface::class, ProjectRepository::class);
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
