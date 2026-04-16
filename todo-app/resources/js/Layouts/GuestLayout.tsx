import { PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* 左：ブランドパネル */}
            <div className="hidden w-1/2 flex-col items-center justify-center bg-indigo-600 p-12 lg:flex">
                <div className="max-w-sm text-center">
                    <div className="mb-6 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                            <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white">TODO アプリ</h1>
                    <p className="mt-4 text-indigo-200">
                        タスクを整理して、毎日の仕事を効率よく進めましょう。
                    </p>
                </div>
            </div>

            {/* 右：フォームパネル */}
            <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
                {/* モバイル用タイトル */}
                <div className="mb-8 flex items-center gap-3 lg:hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">TODO アプリ</span>
                </div>

                <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-800">
                    {children}
                </div>
            </div>
        </div>
    );
}
