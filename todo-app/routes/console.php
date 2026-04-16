<?php

use App\Jobs\SendTaskReminderJob;
use App\Models\Task;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// 毎朝8時に翌日期限のタスクをリマインドメール送信
Schedule::call(function () {
    $tomorrow = now()->addDay()->startOfDay();

    Task::with('user')
        ->whereDate('due_date', $tomorrow->toDateString())
        ->whereNot('status', 'done')
        ->whereHas('user', fn ($q) => $q->where('remind_enabled', true))
        ->each(fn (Task $task) => SendTaskReminderJob::dispatch($task));
})->dailyAt('08:00')->name('send-task-reminders');
