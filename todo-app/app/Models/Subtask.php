<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * タスクの中のチェック項目。タスクを論理削除しても残り、タスクを元に戻すと一緒に戻る。
 */
class Subtask extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'is_done',
        'order',
    ];

    protected $attributes = [
        'is_done' => false,
    ];

    protected $casts = [
        'is_done' => 'boolean',
    ];

    protected $hidden = ['created_at', 'updated_at'];

    /** @return BelongsTo<Task, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
