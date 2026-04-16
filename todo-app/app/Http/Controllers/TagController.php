<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tag\StoreTagRequest;
use App\Http\Requests\Tag\UpdateTagRequest;
use App\Models\Tag;
use App\Repositories\Contracts\TagRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function __construct(private TagRepositoryInterface $tagRepository) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->tagRepository->listByUser($request->user()));
    }

    public function store(StoreTagRequest $request): JsonResponse
    {
        $tag = $this->tagRepository->create($request->user(), $request->validated());

        return response()->json($tag, 201);
    }

    public function update(UpdateTagRequest $request, Tag $tag): JsonResponse
    {
        $this->authorize('update', $tag);

        return response()->json($this->tagRepository->update($tag, $request->validated()));
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $this->authorize('delete', $tag);

        $this->tagRepository->delete($tag);

        return response()->json(null, 204);
    }
}
