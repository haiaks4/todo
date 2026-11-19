<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class JapaneseMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_failure_message_is_japanese(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertSessionHasErrors(['email' => 'メールアドレスまたはパスワードが正しくありません。']);
    }

    public function test_password_reset_link_status_is_japanese(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email])
            ->assertSessionHas('status', 'パスワード再設定用のリンクをメールで送信しました。');

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
            $mail = $notification->toMail($user);

            return $mail->subject === 'パスワード再設定のお知らせ'
                && $mail->actionText === 'パスワードを再設定する';
        });
    }

    public function test_password_confirmation_mismatch_message_is_japanese(): void
    {
        $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'different',
        ])->assertSessionHasErrors(['password' => 'パスワードの確認が一致しません。']);
    }
}
