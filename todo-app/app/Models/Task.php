<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'tag_id',
        'title',
        'description',
        'due_date',
        'priority',
        'status',
        'order',
    ];

    /**
     * due_date はタイムゾーン無しのローカル日時（APP_TIMEZONE）として扱う。
     * フロントエンドの datetime-local 入力とそのまま相互変換できるよう、
     * オフセット無しの ISO 8601 形式でシリアライズする。
     */
    protected $casts = [
        'due_date' => 'datetime:Y-m-d\\TH:i:s',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tag()
    {
        return $this->belongsTo(Tag::class);
    }
}
