<?php

namespace App\Jobs;

use App\Mail\TaskReminderMail;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendTaskReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * キュー投入後にタスクが削除された場合はジョブを破棄する。
     */
    public bool $deleteWhenMissingModels = true;

    public int $tries = 3;

    public function __construct(public Task $task) {}

    public function handle(): void
    {
        $task = $this->task->loadMissing('user');

        // キュー投入後に完了・期限変更・通知オフにされた場合は送信しない
        if ($task->status === 'done' || ! $task->user?->remind_enabled || $task->due_date === null) {
            return;
        }

        Mail::to($this->task->user->email)->send(new TaskReminderMail($this->task));
    }
}
