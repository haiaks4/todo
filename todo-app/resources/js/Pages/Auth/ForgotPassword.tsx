import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import InputError from '@/Components/InputError';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="パスワードをお忘れの方" />

            <div className="mb-6">
                <h2 className="text-2xl font-bold">パスワードをお忘れの方</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
                </p>
            </div>

            {status && (
                <Alert className="mb-4">
                    <AlertDescription>{status}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        aria-invalid={!!errors.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={processing}
                >
                    {processing ? '送信中...' : '再設定用のリンクを送信'}
                </Button>

                <p className="text-center text-sm">
                    <Link
                        href={route('login')}
                        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        ログインに戻る
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
