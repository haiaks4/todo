<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_projects_can_be_created_renamed_and_listed_with_active_task_counts(): void
    {
        $work = $this->actingAs($this->user)
            ->postJson('/api/projects', ['name' => '仕事'])
            ->assertCreated()
            ->assertJson(['name' => '仕事', 'active_tasks_count' => 0])
            ->json('id');
        $this->actingAs($this->user)->postJson('/api/projects', ['name' => '家'])->assertCreated();

        Task::factory()->for($this->user)->count(2)->create(['project_id' => $work]);
        Task::factory()->for($this->user)->create(['project_id' => $work, 'status' => 'done']);

        $this->actingAs($this->user)
            ->patchJson("/api/projects/{$work}", ['name' => '仕事（本業）'])
            ->assertOk()
            ->assertJsonPath('name', '仕事（本業）');

        // 作った順に並び、未完了のタスク数が付く
        $this->actingAs($this->user)->getJson('/api/projects')
            ->assertOk()
            ->assertJsonPath('0.name', '仕事（本業）')
            ->assertJsonPath('0.active_tasks_count', 2)
            ->assertJsonPath('1.name', '家');
    }

    public function test_name_is_required_and_unique_per_user(): void
    {
        Project::factory()->for($this->user)->create(['name' => '仕事']);
        Project::factory()->create(['name' => '家']); // 他のユーザーの同名は問題ない

        $this->actingAs($this->user)->postJson('/api/projects', ['name' => ''])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->actingAs($this->user)->postJson('/api/projects', ['name' => '仕事'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name' => 'プロジェクト名はすでに使用されています。']);
        $this->actingAs($this->user)->postJson('/api/projects', ['name' => '家'])->assertCreated();
        $this->actingAs($this->user)->postJson('/api/projects', ['name' => str_repeat('あ', 51)])
            ->assertUnprocessable();

        // 自分自身の名前のままの更新はできる
        $project = $this->user->projects()->where('name', '仕事')->first();
        $this->actingAs($this->user)->patchJson("/api/projects/{$project->id}", ['name' => '仕事'])->assertOk();
    }

    public function test_deleting_a_project_moves_its_tasks_to_the_inbox(): void
    {
        $project = Project::factory()->for($this->user)->create();
        $task = Task::factory()->for($this->user)->create(['project_id' => $project->id]);
        $trashed = Task::factory()->for($this->user)->create(['project_id' => $project->id]);
        $trashed->delete();

        $this->actingAs($this->user)->deleteJson("/api/projects/{$project->id}")->assertNoContent();

        $this->assertModelMissing($project);
        $this->assertNull($task->fresh()->project_id);
        $this->assertNull(Task::withTrashed()->find($trashed->id)->project_id);
    }

    public function test_other_users_projects_cannot_be_touched_or_assigned(): void
    {
        $others = Project::factory()->create();

        $this->actingAs($this->user)->patchJson("/api/projects/{$others->id}", ['name' => 'x'])->assertForbidden();
        $this->actingAs($this->user)->deleteJson("/api/projects/{$others->id}")->assertForbidden();
        $this->actingAs($this->user)->getJson('/api/projects')->assertJsonCount(0);

        $this->actingAs($this->user)
            ->postJson('/api/tasks', ['title' => 'a', 'project_id' => $others->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('project_id');
    }

    public function test_tasks_can_be_filtered_by_project_or_inbox(): void
    {
        $project = Project::factory()->for($this->user)->create(['name' => '仕事']);
        $inProject = $this->actingAs($this->user)
            ->postJson('/api/tasks', ['title' => 'プロジェクトのタスク', 'project_id' => $project->id])
            ->assertCreated()
            ->assertJsonPath('project.name', '仕事')
            ->json('id');
        $inbox = Task::factory()->for($this->user)->create(['title' => 'インボックスのタスク']);

        $this->actingAs($this->user)->getJson("/api/tasks?project_id={$project->id}")
            ->assertJsonCount(1)->assertJsonPath('0.id', $inProject);
        $this->actingAs($this->user)->getJson('/api/tasks?project_id=none')
            ->assertJsonCount(1)->assertJsonPath('0.id', $inbox->id);
        $this->actingAs($this->user)->getJson('/api/tasks')->assertJsonCount(2);
        $this->actingAs($this->user)->getJson('/api/tasks?project_id=abc')->assertUnprocessable();

        // 別のプロジェクトへ移す・インボックスに戻す
        $this->actingAs($this->user)->patchJson("/api/tasks/{$inProject}", ['project_id' => null])
            ->assertOk()->assertJsonPath('project', null);
    }
}
