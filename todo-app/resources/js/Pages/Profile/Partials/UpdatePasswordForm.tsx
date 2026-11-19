import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useRef } from 'react';
import { toast } from 'sonner';
import InputError from '@/Components/InputError';
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

export default function UpdatePasswordForm() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                toast.success('パスワードを変更しました。');
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <Card>
            <form onSubmit={updatePassword} className="contents">
                <CardHeader>
                    <CardTitle>パスワードの変更</CardTitle>
                    <CardDescription>
                        安全のため、推測されにくい長めのパスワードを設定してください。
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="current_password">
                            現在のパスワード
                        </Label>
                        <Input
                            id="current_password"
                            ref={currentPasswordInput}
                            type="password"
                            value={data.current_password}
                            autoComplete="current-password"
                            aria-invalid={!!errors.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                        />
                        <InputError message={errors.current_password} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">新しいパスワード</Label>
                        <Input
                            id="password"
                            ref={passwordInput}
                            type="password"
                            value={data.password}
                            autoComplete="new-password"
                            aria-invalid={!!errors.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">
                            新しいパスワード（確認）
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            aria-invalid={!!errors.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </CardContent>

                <CardFooter>
                    <Button type="submit" disabled={processing}>
                        変更する
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
