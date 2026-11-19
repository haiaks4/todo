<?php

namespace Database\Seeders;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * E2E テスト（Playwright）用のデータ。
 * テストはそれぞれ自分でタスクを作るので、ここではログインするユーザーとタグだけを用意する。
 */
class E2eSeeder extends Seeder
{
    public const EMAIL = 'e2e@example.com';

    public const PASSWORD = 'password';

    public function run(): void
    {
        $user = User::factory()->create([
            'name'     => 'E2E ユーザー',
            'email'    => self::EMAIL,
            'password' => self::PASSWORD,
        ]);

        Tag::create(['user_id' => $user->id, 'name' => '仕事']);
    }
}
