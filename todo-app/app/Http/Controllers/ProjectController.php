<?php

namespace App\Http\Controllers;

use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(private ProjectRepositoryInterface $projectRepository) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->projectRepository->listByUser($request->user()));
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = $this->projectRepository->create($request->user(), $request->validated());

        return response()->json($project, 201);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        return response()->json($this->projectRepository->update($project, $request->validated()));
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $this->projectRepository->delete($project);

        return response()->json(null, 204);
    }
}
