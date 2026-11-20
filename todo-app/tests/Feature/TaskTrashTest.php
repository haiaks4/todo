<?php

namespace Tests\Feature;

use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TaskTrashTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_trash_lists_only_own_deleted_tasks_newest_first(): void
    {
        $older = Task::factory()->for($this->user)->create(['title' => '古い']);
        $newer = Task::factory()->for($this->user)->create(['title' => '新しい']);
        Task::factory()->for($this->user)->create(['title' => '削除していない']);
        $others = Task::factory()->create();

        Carbon::setTestNow('2026-11-19 10:00:00');
        $older->delete();
        Carbon::setTestNow('2026-11-20 10:00:00');
        $newer->delete();
        $others->delete();
        Carbon::setTestNow();

        $this->actingAs($this->user)->getJson('/api/tasks/trash')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.title', '新しい')
            ->assertJsonPath('1.title', '古い')
            ->assertJsonStructure([['id', 'title', 'deleted_at', 'tag', 'subtasks']]);
    }

    public function test_force_delete_removes_task_and_its_subtasks(): void
    {
        $task = Task::factory()->for($this->user)->create();
        $subtask = Subtask::factory()->for($task)->create();
        $task->delete();

        $this->actingAs($this->user)
            ->postJson('/api/tasks/force-delete', ['ids' => [$task->id]])
            ->assertNoContent();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
        $this->assertDatabaseMissing('subtasks', ['id' => $subtask->id]);
    }

    public function test_force_delete_accepts_only_own_trashed_tasks(): void
    {
        $alive = Task::factory()->for($this->user)->create();
        $others = Task::factory()->create();
        $others->delete();

        $this->actingAs($this->user)
            ->postJson('/api/tasks/force-delete', ['ids' => [$alive->id]])
            ->assertUnprocessable();
        $this->actingAs($this->user)
            ->postJson('/api/tasks/force-delete', ['ids' => [$others->id]])
            ->assertUnprocessable();

        $this->assertNotSoftDeleted($alive);
        $this->assertSoftDeleted($others);
    }

    public function test_empty_trash_removes_only_own_trashed_tasks(): void
    {
        $mine = Task::factory()->for($this->user)->count(2)->create();
        $mine->each->delete();
        $alive = Task::factory()->for($this->user)->create();
        $others = Task::factory()->create();
        $others->delete();

        $this->actingAs($this->user)->deleteJson('/api/tasks/trash')->assertNoContent();

        $this->assertSame(0, Task::onlyTrashed()->where('user_id', $this->user->id)->count());
        $this->assertNotSoftDeleted($alive);
        $this->assertSoftDeleted($others);
    }

    public function test_purge_command_deletes_tasks_trashed_more_than_30_days_ago(): void
    {
        $old = Task::factory()->for($this->user)->create();
        $recent = Task::factory()->for($this->user)->create();

        Carbon::setTestNow('2026-10-01 00:00:00');
        $old->delete();
        Carbon::setTestNow('2026-11-01 00:00:00');
        $recent->delete();

        Carbon::setTestNow('2026-11-20 03:00:00');
        $this->artisan('tasks:purge-trash')
            ->expectsOutput('ごみ箱から 1 件のタスクを完全に削除しました。')
            ->assertSuccessful();
        Carbon::setTestNow();

        $this->assertDatabaseMissing('tasks', ['id' => $old->id]);
        $this->assertSoftDeleted($recent);
    }

    public function test_trash_page_is_shown(): void
    {
        $this->actingAs($this->user)->get('/task/trash')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Task/Trash')->where('retentionDays', 30));
    }
}
