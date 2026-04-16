<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\BulkDestroyTaskRequest;
use App\Http\Requests\Task\ReorderTaskRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Task;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(private TaskRepositoryInterface $taskRepository) {}

    public function index(): Response
    {
        return Inertia::render('Task/Index');
    }

    public function list(Request $request): JsonResponse
    {
        $tasks = $this->taskRepository->listByUser($request->user(), $request->only([
            'status', 'tag_id', 'priority', 'search',
        ]));

        return response()->json($tasks);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->taskRepository->create($request->user(), $request->validated());

        return response()->json($task->load('tag'), 201);
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        return response()->json($task->load('tag'));
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $updated = $this->taskRepository->update($task, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        $this->taskRepository->delete($task);

        return response()->json(null, 204);
    }

    public function duplicate(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $copied = $this->taskRepository->duplicate($task);

        return response()->json($copied, 201);
    }

    public function bulkDestroy(BulkDestroyTaskRequest $request): JsonResponse
    {
        $this->taskRepository->bulkDelete($request->user(), $request->validated('ids'));

        return response()->json(null, 204);
    }

    public function reorder(ReorderTaskRequest $request): JsonResponse
    {
        $this->taskRepository->reorder($request->user(), $request->validated('ids'));

        return response()->json(null, 204);
    }
}
