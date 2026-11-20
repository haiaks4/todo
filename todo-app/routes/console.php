<?php

use App\Http\Controllers\TaskController;
use App\Jobs\SendTaskReminderJob;
use App\Models\Task;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// 毎朝8時に翌日期限のタスクをリマインドメール送信
Schedule::call(function () {
    $tomorrow = now()->addDay();

    Task::query()
        ->whereBetween('due_date', [$tomorrow->copy()->startOfDay(), $tomorrow->copy()->endOfDay()])
        ->where('status', '!=', 'done')
        ->whereHas('user', fn ($q) => $q->where('remind_enabled', true))
        ->chunkById(200, function ($tasks) {
            $tasks->each(fn (Task $task) => SendTaskReminderJob::dispatch($task));
        });
})->dailyAt('08:00')->name('send-task-reminders')->withoutOverlapping()->onOneServer();

// ごみ箱に入れてから一定日数たったタスクを、毎日深夜に完全に削除する
Artisan::command('tasks:purge-trash', function (TaskRepositoryInterface $tasks) {
    $count = $tasks->purgeTrashedBefore(now()->subDays(TaskController::TRASH_RETENTION_DAYS));
    $this->info("ごみ箱から {$count} 件のタスクを完全に削除しました。");
})->purpose('ごみ箱に入れてから一定日数たったタスクを完全に削除する');

Schedule::command('tasks:purge-trash')->dailyAt('03:00')->name('purge-trashed-tasks')->withoutOverlapping()->onOneServer();
