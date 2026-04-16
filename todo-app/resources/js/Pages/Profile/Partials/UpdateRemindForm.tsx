import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function UpdateRemindForm({
    remindEnabled,
    className = '',
}: {
    remindEnabled: boolean;
    className?: string;
}) {
    const { data, setData, patch, processing, recentlySuccessful } = useForm({
        remind_enabled: remindEnabled,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.remind'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    リマインド通知
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    有効にすると、期限の1日前にタスクのリマインドメールを送信します。
                </p>
            </header>

            <form onSubmit={submit} className="mt-6">
                <label className="flex cursor-pointer items-center gap-3">
                    <input
                        type="checkbox"
                        checked={data.remind_enabled}
                        onChange={(e) => setData('remind_enabled', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        リマインドメールを受け取る
                    </span>
                </label>

                <div className="mt-4 flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        保存
                    </button>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">保存しました。</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
