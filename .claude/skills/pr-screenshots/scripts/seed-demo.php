<?php

// スクリーンショット用のデモデータ（php artisan tinker から実行する）
// ログイン: demo@example.com / password

use App\Models\Tag;
use App\Models\Task;
use App\Models\User;

$user = User::firstOrCreate(
    ['email' => 'demo@example.com'],
    ['name' => 'デモユーザー', 'password' => bcrypt('password'), 'email_verified_at' => now()],
);

$work = Tag::firstOrCreate(['user_id' => $user->id, 'name' => '仕事']);
$home = Tag::firstOrCreate(['user_id' => $user->id, 'name' => '家事']);

if ($user->tasks()->doesntExist()) {
    $rows = [
        ['四半期レポートの資料作成とレビュー依頼（営業部・開発部の数値を反映する）', 'todo', 'high', $work, now()->subDay()->setTime(18, 0)],
        ['新メンバーのオンボーディング資料を更新する', 'in_progress', 'medium', $work, now()->addDay()->setTime(10, 0)],
        ['牛乳と卵を買う', 'todo', null, $home, null],
        ['週次ミーティングの議事録を共有', 'done', 'low', $work, now()->subDays(2)->setTime(15, 0)],
        ['エアコンのフィルター掃除', 'todo', 'low', $home, now()->addDays(5)->setTime(9, 0)],
        ['経費精算', 'todo', 'medium', null, now()->setTime(23, 30)],
        ['歯医者の予約', 'todo', null, $home, now()->addDays(3)->setTime(17, 30)],
    ];
    foreach ($rows as $i => [$title, $status, $priority, $tag, $due]) {
        Task::create([
            'user_id'     => $user->id,
            'tag_id'      => $tag?->id,
            'title'       => $title,
            'description' => $i === 0 ? "・売上の推移グラフを追加\n・前年同期との比較を入れる" : null,
            'status'      => $status,
            'priority'    => $priority,
            'due_date'    => $due,
            'order'       => $i + 1,
        ]);
    }
}

echo "seeded\n";
