import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="メールアドレスの確認" />

            <div className="mb-6">
                <h2 className="text-2xl font-bold">メールアドレスの確認</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    ご登録ありがとうございます。お送りしたメールのリンクをクリックして、メールアドレスを確認してください。メールが届いていない場合は、もう一度送信できます。
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <Alert className="mb-4">
                    <AlertDescription>
                        確認用のリンクを、登録したメールアドレスに再送信しました。
                    </AlertDescription>
                </Alert>
            )}

            <form
                onSubmit={submit}
                className="flex items-center justify-between gap-4"
            >
                <Button type="submit" disabled={processing}>
                    確認メールを再送信
                </Button>

                <Button asChild variant="link">
                    <Link href={route('logout')} method="post" as="button">
                        ログアウト
                    </Link>
                </Button>
            </form>
        </GuestLayout>
    );
}
