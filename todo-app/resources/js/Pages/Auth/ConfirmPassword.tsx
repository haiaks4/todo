import { Head, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="パスワードの確認" />

            <div className="mb-6">
                <h2 className="text-2xl font-bold">パスワードの確認</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    この操作を続けるには、パスワードを入力してください。
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="password">パスワード</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        autoFocus
                        aria-invalid={!!errors.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={processing}
                >
                    確認
                </Button>
            </form>
        </GuestLayout>
    );
}
