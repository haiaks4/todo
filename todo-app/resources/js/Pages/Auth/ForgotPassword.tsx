import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">パスワードをお忘れの方</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="block w-full"
                        placeholder="メールアドレス"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {processing ? '送信中...' : 'リセットリンクを送信'}
                </button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <Link
                        href={route('login')}
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                        ログインに戻る
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
