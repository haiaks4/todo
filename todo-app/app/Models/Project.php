<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * タスクをまとめるプロジェクト（リスト）。削除すると、中のタスクはインボックス（プロジェクトなし）に移る。
 */
class Project extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'order'];

    protected $hidden = ['created_at', 'updated_at'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
