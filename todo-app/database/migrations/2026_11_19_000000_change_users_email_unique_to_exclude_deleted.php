<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 退会（論理削除）済みユーザーと同じメールアドレスで再登録できるよう、
 * email 単独のユニーク制約を (email, deleted_at) の複合ユニーク制約に変更する。
 * deleted_at が NULL（有効なユーザー）同士は MySQL・SQLite ともに NULL を等しいとみなさないため、
 * 有効なユーザー間の重複はアプリケーション側のバリデーションで防ぐ。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->unique(['email', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email', 'deleted_at']);
            $table->unique('email');
        });
    }
};
