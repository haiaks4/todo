<?php

namespace App\Repositories\Contracts;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Collection;

interface TagRepositoryInterface
{
    public function listByUser(User $user): Collection;

    public function create(User $user, array $data): Tag;

    public function update(Tag $tag, array $data): Tag;

    public function delete(Tag $tag): void;
}
