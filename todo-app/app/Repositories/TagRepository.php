<?php

namespace App\Repositories;

use App\Models\Tag;
use App\Models\User;
use App\Repositories\Contracts\TagRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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
        // タグはソフトデリートのため外部キーの ON DELETE SET NULL が働かない。
        // 関連タスクのタグを明示的に外してから削除する。
        DB::transaction(function () use ($tag) {
            $tag->tasks()->withTrashed()->update(['tag_id' => null]);
            $tag->delete();
        });
    }
}
