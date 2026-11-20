<?php

namespace Tests\Feature;

use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubtaskApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_subtasks_can_be_added_updated_and_deleted(): void
    {
        $task = Task::factory()->for($this->user)->create();

        $first = $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/subtasks", ['title' => '資料を集める'])
            ->assertCreated()
            ->assertJson(['title' => '資料を集める', 'is_done' => false])
            ->json('id');
        $second = $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/subtasks", ['title' => 'レビュー依頼'])
            ->assertCreated()
            ->json('id');

        $this->actingAs($this->user)
            ->patchJson("/api/subtasks/{$first}", ['is_done' => true])
            ->assertOk()
            ->assertJson(['is_done' => true, 'title' => '資料を集める']);
        $this->actingAs($this->user)
            ->patchJson("/api/subtasks/{$second}", ['title' => 'レビューを依頼する'])
            ->assertOk();

        // タスクの一覧・詳細に、追加した順で含まれる
        $this->actingAs($this->user)->getJson('/api/tasks')
            ->assertJsonPath('0.subtasks.0.title', '資料を集める')
            ->assertJsonPath('0.subtasks.0.is_done', true)
            ->assertJsonPath('0.subtasks.1.title', 'レビューを依頼する');

        $this->actingAs($this->user)->deleteJson("/api/subtasks/{$first}")->assertNoContent();
        $this->actingAs($this->user)->getJson("/api/tasks/{$task->id}")
            ->assertJsonCount(1, 'subtasks');
    }

    public function test_title_is_required(): void
    {
        $task = Task::factory()->for($this->user)->create();
        $subtask = Subtask::factory()->for($task)->create();

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/subtasks", ['title' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');
        $this->actingAs($this->user)
            ->patchJson("/api/subtasks/{$subtask->id}", ['title' => str_repeat('あ', 256)])
            ->assertUnprocessable();
    }

    public function test_other_users_subtasks_cannot_be_touched(): void
    {
        $othersTask = Task::factory()->create();
        $othersSubtask = Subtask::factory()->for($othersTask)->create();

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$othersTask->id}/subtasks", ['title' => 'x'])
            ->assertForbidden();
        $this->actingAs($this->user)
            ->patchJson("/api/subtasks/{$othersSubtask->id}", ['is_done' => true])
            ->assertForbidden();
        $this->actingAs($this->user)
            ->deleteJson("/api/subtasks/{$othersSubtask->id}")
            ->assertForbidden();

        $this->assertFalse($othersSubtask->fresh()->is_done);
    }

    public function test_subtasks_of_deleted_task_cannot_be_changed_but_come_back_with_restore(): void
    {
        $task = Task::factory()->for($this->user)->create();
        $subtask = Subtask::factory()->for($task)->create();

        $this->actingAs($this->user)->deleteJson("/api/tasks/{$task->id}")->assertNoContent();
        $this->actingAs($this->user)
            ->patchJson("/api/subtasks/{$subtask->id}", ['is_done' => true])
            ->assertNotFound();

        $this->actingAs($this->user)->postJson('/api/tasks/restore', ['ids' => [$task->id]])->assertNoContent();
        $this->actingAs($this->user)->getJson("/api/tasks/{$task->id}")
            ->assertJsonPath('subtasks.0.id', $subtask->id);
    }

    public function test_duplicate_copies_subtasks_unchecked(): void
    {
        $task = Task::factory()->for($this->user)->create();
        Subtask::factory()->for($task)->create(['title' => 'A', 'is_done' => true, 'order' => 1]);
        Subtask::factory()->for($task)->create(['title' => 'B', 'order' => 2]);

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/duplicate")
            ->assertCreated()
            ->assertJsonPath('subtasks.0.title', 'A')
            ->assertJsonPath('subtasks.0.is_done', false)
            ->assertJsonPath('subtasks.1.title', 'B');
    }
}
