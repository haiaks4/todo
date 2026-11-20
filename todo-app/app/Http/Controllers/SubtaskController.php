<?php

namespace App\Http\Controllers;

use App\Http\Requests\Subtask\StoreSubtaskRequest;
use App\Http\Requests\Subtask\UpdateSubtaskRequest;
use App\Models\Subtask;
use App\Models\Task;
use App\Repositories\Contracts\SubtaskRepositoryInterface;
use Illuminate\Http\JsonResponse;

/**
 * タスクの中のチェック項目。権限はタスクの持ち主かどうか（TaskPolicy）で判断する。
 */
class SubtaskController extends Controller
{
    public function __construct(private SubtaskRepositoryInterface $subtaskRepository) {}

    public function store(StoreSubtaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $subtask = $this->subtaskRepository->create($task, $request->validated('title'));

        return response()->json($subtask, 201);
    }

    public function update(UpdateSubtaskRequest $request, Subtask $subtask): JsonResponse
    {
        $this->authorize('update', $this->parentTask($subtask));

        return response()->json($this->subtaskRepository->update($subtask, $request->validated()));
    }

    public function destroy(Subtask $subtask): JsonResponse
    {
        $this->authorize('delete', $this->parentTask($subtask));

        $this->subtaskRepository->delete($subtask);

        return response()->json(null, 204);
    }

    /** 削除済みのタスクのチェック項目は操作できない（404 にする） */
    private function parentTask(Subtask $subtask): Task
    {
        $task = $subtask->task;
        abort_if($task === null, 404);

        return $task;
    }
}
