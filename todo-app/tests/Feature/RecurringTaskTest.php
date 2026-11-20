<?php

namespace Tests\Feature;

use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class RecurringTaskTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Carbon::setTestNow('2026-11-20 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_completing_a_recurring_task_moves_it_to_the_next_due_date(): void
    {
        $task = Task::factory()->for($this->user)->create([
            'due_date' => '2026-11-20 18:00:00', 'recurrence' => 'weekly', 'status' => 'in_progress',
        ]);
        Subtask::factory()->for($task)->create(['is_done' => true]);

        $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$task->id}", ['status' => 'done'])
            ->assertOk()
            ->assertJsonPath('status', 'todo')
            ->assertJsonPath('due_date', '2026-11-27T18:00:00')
            ->assertJsonPath('recurrence', 'weekly')
            ->assertJsonPath('subtasks.0.is_done', false);
    }

    public function test_non_recurring_task_is_simply_completed(): void
    {
        $task = Task::factory()->for($this->user)->create(['due_date' => '2026-11-20 18:00:00']);

        $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$task->id}", ['status' => 'done'])
            ->assertJsonPath('status', 'done')
            ->assertJsonPath('due_date', '2026-11-20T18:00:00');
    }

    public function test_bulk_complete_advances_recurring_tasks_and_completes_others(): void
    {
        $recurring = Task::factory()->for($this->user)->create(['due_date' => '2026-11-20 09:00:00', 'recurrence' => 'daily']);
        $normal = Task::factory()->for($this->user)->create();

        $this->actingAs($this->user)
            ->postJson('/api/tasks/bulk-status', ['ids' => [$recurring->id, $normal->id], 'status' => 'done'])
            ->assertNoContent();

        $this->assertSame('todo', $recurring->fresh()->status);
        $this->assertSame('2026-11-21 09:00:00', $recurring->fresh()->due_date->format('Y-m-d H:i:s'));
        $this->assertSame('done', $normal->fresh()->status);
    }

    public function test_recurrence_requires_due_date(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/tasks', ['title' => 'a', 'recurrence' => 'daily'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['due_date' => '繰り返すには期限を設定してください。']);

        $this->actingAs($this->user)
            ->postJson('/api/tasks', ['title' => 'a', 'recurrence' => 'hourly', 'due_date' => '2026-11-21T09:00'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('recurrence');

        // 繰り返しのタスクから期限だけを消すことはできない
        $task = Task::factory()->for($this->user)->create(['due_date' => '2026-11-21 09:00:00', 'recurrence' => 'daily']);
        $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$task->id}", ['due_date' => null])
            ->assertUnprocessable();
        $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$task->id}", ['due_date' => null, 'recurrence' => null])
            ->assertOk()
            ->assertJsonPath('recurrence', null);
    }
}
