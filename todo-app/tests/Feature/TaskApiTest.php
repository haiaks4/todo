<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_guest_cannot_access_task_api(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
    }

    public function test_user_can_create_task(): void
    {
        $tag = Tag::factory()->for($this->user)->create();

        $this->actingAs($this->user)
            ->postJson('/api/tasks', [
                'title'    => '牛乳を買う',
                'due_date' => '2026-11-20T10:30',
                'priority' => 'high',
                'tag_id'   => $tag->id,
            ])
            ->assertCreated()
            ->assertJsonPath('title', '牛乳を買う')
            ->assertJsonPath('status', 'todo')
            ->assertJsonPath('due_date', '2026-11-20T10:30:00')
            ->assertJsonPath('tag.id', $tag->id);
    }

    public function test_validation_errors_are_returned_in_japanese(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/tasks', ['title' => str_repeat('a', 256)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title' => 'タイトルは255文字以内で入力してください。']);

        $this->actingAs($this->user)
            ->postJson('/api/tasks', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title' => 'タイトルは必須です。']);
    }

    public function test_user_cannot_attach_another_users_tag(): void
    {
        $otherTag = Tag::factory()->create();

        $this->actingAs($this->user)
            ->postJson('/api/tasks', ['title' => 'x', 'tag_id' => $otherTag->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tag_id');
    }

    public function test_user_only_sees_own_tasks_and_can_filter(): void
    {
        Task::factory()->for($this->user)->create(['title' => '100% 完了', 'status' => 'done']);
        Task::factory()->for($this->user)->create(['title' => '未着手のタスク', 'status' => 'todo']);
        Task::factory()->create(['title' => '他人のタスク']);

        $this->actingAs($this->user)->getJson('/api/tasks')->assertOk()->assertJsonCount(2);
        $this->actingAs($this->user)->getJson('/api/tasks?status=done')->assertJsonCount(1);

        // % はワイルドカードではなく文字として扱われる
        $this->actingAs($this->user)
            ->getJson('/api/tasks?search=' . urlencode('100%'))
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', '100% 完了');
        $this->actingAs($this->user)->getJson('/api/tasks?search=' . urlencode('%'))->assertJsonCount(1);
    }

    public function test_user_cannot_modify_another_users_task(): void
    {
        $task = Task::factory()->create();

        $this->actingAs($this->user)->getJson("/api/tasks/{$task->id}")->assertForbidden();
        $this->actingAs($this->user)->patchJson("/api/tasks/{$task->id}", ['title' => 'x'])->assertForbidden();
        $this->actingAs($this->user)->deleteJson("/api/tasks/{$task->id}")->assertForbidden();
        $this->actingAs($this->user)->postJson("/api/tasks/{$task->id}/duplicate")->assertForbidden();
    }

    public function test_bulk_delete_rejects_other_users_tasks(): void
    {
        $mine = Task::factory()->for($this->user)->create();
        $others = Task::factory()->create();

        $this->actingAs($this->user)
            ->postJson('/api/tasks/bulk-delete', ['ids' => [$mine->id, $others->id]])
            ->assertUnprocessable();

        $this->assertNotSoftDeleted($others);

        $this->actingAs($this->user)
            ->postJson('/api/tasks/bulk-delete', ['ids' => [$mine->id]])
            ->assertNoContent();

        $this->assertSoftDeleted($mine);
    }

    public function test_partial_reorder_keeps_relative_position_of_other_tasks(): void
    {
        $a = Task::factory()->for($this->user)->create(['order' => 1, 'status' => 'todo']);
        $b = Task::factory()->for($this->user)->create(['order' => 2, 'status' => 'done']);
        $c = Task::factory()->for($this->user)->create(['order' => 3, 'status' => 'todo']);
        $d = Task::factory()->for($this->user)->create(['order' => 4, 'status' => 'done']);

        // status=todo でフィルター中に a と c を入れ替える
        $this->actingAs($this->user)
            ->postJson('/api/tasks/reorder', ['ids' => [$c->id, $a->id]])
            ->assertNoContent();

        $ids = $this->actingAs($this->user)->getJson('/api/tasks')->json('*.id');

        $this->assertSame([$c->id, $b->id, $a->id, $d->id], $ids);
    }

    public function test_duplicate_appends_copy_to_end(): void
    {
        $task = Task::factory()->for($this->user)->create(['title' => '元', 'status' => 'done', 'order' => 5]);

        $this->actingAs($this->user)
            ->postJson("/api/tasks/{$task->id}/duplicate")
            ->assertCreated()
            ->assertJsonPath('title', '元 のコピー')
            ->assertJsonPath('status', 'todo')
            ->assertJsonPath('order', 6);
    }

    public function test_deleting_tag_detaches_it_from_tasks(): void
    {
        $tag = Tag::factory()->for($this->user)->create();
        $task = Task::factory()->for($this->user)->create(['tag_id' => $tag->id]);

        $this->actingAs($this->user)->deleteJson("/api/tags/{$tag->id}")->assertNoContent();

        $this->assertNull($task->fresh()->tag_id);
    }

    public function test_user_cannot_modify_another_users_tag(): void
    {
        $tag = Tag::factory()->create();

        $this->actingAs($this->user)->patchJson("/api/tags/{$tag->id}", ['name' => 'x'])->assertForbidden();
        $this->actingAs($this->user)->deleteJson("/api/tags/{$tag->id}")->assertForbidden();
    }

    public function test_dashboard_shows_task_stats(): void
    {
        Task::factory()->for($this->user)->count(2)->create(['status' => 'todo']);
        Task::factory()->for($this->user)->create(['status' => 'done']);

        $this->actingAs($this->user)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('stats.total', 3)
                ->where('stats.todo', 2)
                ->where('stats.in_progress', 0)
                ->where('stats.done', 1));
    }
}
