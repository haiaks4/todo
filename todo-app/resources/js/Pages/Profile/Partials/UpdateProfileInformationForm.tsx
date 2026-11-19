import InputError from '@/Components/InputError';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('プロフィールを保存しました。'),
        });
    };

    return (
        <Card>
            <form onSubmit={submit} className="contents">
                <CardHeader>
                    <CardTitle>プロフィール</CardTitle>
                    <CardDescription>
                        ユーザー名とメールアドレスを変更できます。
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name">ユーザー名</Label>
                        <Input
                            id="name"
                            value={data.name}
                            autoComplete="name"
                            required
                            aria-invalid={!!errors.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">メールアドレス</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            autoComplete="username"
                            required
                            aria-invalid={!!errors.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} />
                    </div>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <Alert>
                            <AlertDescription>
                                メールアドレスが確認されていません。
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="underline underline-offset-4"
                                >
                                    確認メールを再送信する
                                </Link>
                                {status === 'verification-link-sent' && (
                                    <span className="block">
                                        確認用のリンクをメールアドレスに送信しました。
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>

                <CardFooter>
                    <Button type="submit" disabled={processing}>
                        保存
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
