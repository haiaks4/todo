import AppLogo from '@/Components/AppLogo';
import { Card, CardContent } from '@/Components/ui/card';
import { ListTodo } from 'lucide-react';
import { PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* 左：ブランドパネル（PC のみ） */}
            <div className="hidden w-1/2 flex-col items-center justify-center bg-primary p-12 text-primary-foreground lg:flex">
                <div className="max-w-sm text-center">
                    <div className="mb-6 flex items-center justify-center">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-foreground/15">
                            <ListTodo className="size-9" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold">TODO アプリ</h1>
                    <p className="mt-4 text-primary-foreground/70">
                        タスクを整理して、毎日の仕事を効率よく進めましょう。
                    </p>
                </div>
            </div>

            {/* 右：フォームパネル */}
            <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
                <AppLogo className="mb-8 text-xl lg:hidden" />

                <Card className="w-full max-w-md">
                    <CardContent>{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
