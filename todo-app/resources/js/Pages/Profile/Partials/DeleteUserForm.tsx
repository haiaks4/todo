import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm() {
    const [open, setOpen] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const changeOpen = (next: boolean) => {
        setOpen(next);
        if (!next) {
            clearErrors();
            reset();
        }
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => changeOpen(false),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>退会</CardTitle>
                <CardDescription>
                    退会すると、このアカウントではログインできなくなり、タスクやタグも表示されなくなります。
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button variant="destructive" onClick={() => changeOpen(true)}>
                    退会する
                </Button>
            </CardFooter>

            <Dialog open={open} onOpenChange={changeOpen}>
                <DialogContent>
                    <form onSubmit={deleteUser} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>本当に退会しますか？</DialogTitle>
                            <DialogDescription>
                                確認のため、パスワードを入力してください。
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Label
                                htmlFor="delete_password"
                                className="sr-only"
                            >
                                パスワード
                            </Label>
                            <Input
                                id="delete_password"
                                ref={passwordInput}
                                type="password"
                                placeholder="パスワード"
                                value={data.password}
                                autoComplete="current-password"
                                autoFocus
                                aria-invalid={!!errors.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                            <InputError message={errors.password} />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => changeOpen(false)}
                            >
                                キャンセル
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                退会する
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
