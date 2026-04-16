<?php

namespace App\Repositories;

use App\Models\Tag;
use App\Models\User;
use App\Repositories\Contracts\TagRepositoryInterface;
use Illuminate\Support\Collection;

class TagRepository implements TagRepositoryInterface
{
    public function listByUser(User $user): Collection
    {
        return $user->tags()->orderBy('name')->get();
    }

    public function create(User $user, array $data): Tag
    {
        return $user->tags()->create($data);
    }

    public function update(Tag $tag, array $data): Tag
    {
        $tag->update($data);

        return $tag->fresh();
    }

    public function delete(Tag $tag): void
    {
        $tag->delete();
    }
}
