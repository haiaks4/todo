import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { api, fetcher, getErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/task';
import type { Task } from '@/types';

/** 論理削除したタスク（deleted_at 付き） */
type TrashedTask = Task & { deleted_at: string };

interface Props {
    /** 削除してから完全に削除するまでの日数 */
    retentionDays: number;
}

export default function Trash({ retentionDays }: Props) {
    const { data, error, isLoading, mutate } = useSWR<TrashedTask[]>(
        '/api/tasks/trash',
        fetcher,
        // タスク管理から移ってきたとき、直前に取得していても必ず取り直す
        { dedupingInterval: 0 },
    );
    const tasks = data ?? [];

    // 完全に削除する前の確認（'all' は「ごみ箱を空にする」、null は確認なし）
    const [confirming, setConfirming] = useState<TrashedTask | null | 'all'>(
        null,
    );

    /** 一覧から先に消し、失敗したら読み込み直す */
    const removeFromList = (ids: number[]) =>
        mutate(
            tasks.filter((t) => !ids.includes(t.id)),
            { revalidate: false },
        );

    const restore = async (task: TrashedTask) => {
        removeFromList([task.id]);
        try {
            await api.tasks.restore([task.id]);
            toast.success(`「${task.title}」を元に戻しました。`, {
                action: {
                    label: 'タスク管理へ',
                    onClick: () => router.visit(route('task.index')),
                },
            });
        } catch (e) {
            toast.error(getErrorMessage(e));
            mutate();
        }
    };

    const forceDelete = async (task: TrashedTask) => {
        removeFromList([task.id]);
        try {
            await api.tasks.forceDelete([task.id]);
            toast.success(`「${task.title}」を完全に削除しました。`);
        } catch (e) {
            toast.error(getErrorMessage(e));
            mutate();
        }
    };

    const emptyTrash = async () => {
        const count = tasks.length;
        mutate([], { revalidate: false });
        try {
            await api.tasks.emptyTrash();
            toast.success(`${count} 件のタスクを完全に削除しました。`);
        } catch (e) {
            toast.error(getErrorMessage(e));
            mutate();
        }
    };

    return (
        <AuthenticatedLayout header="ごみ箱">
            <Head title="ごみ箱" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('task.index')}>
                                <ArrowLeft />
                                タスク管理に戻る
                            </Link>
                        </Button>
                        {tasks.length > 0 && (
                            <Button
                                variant="outline"
                                className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setConfirming('all')}
                            >
                                <Trash2 />
                                ごみ箱を空にする
                            </Button>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        削除したタスクは、{retentionDays}
                        日たつと自動で完全に削除されます。
                    </p>

                    {error && !data ? (
                        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-8 text-sm text-destructive">
                            {getErrorMessage(error)}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => mutate()}
                            >
                                <RotateCw />
                                再読み込み
                            </Button>
                        </div>
                    ) : isLoading && !data ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            読み込み中...
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
                            <Trash2 className="size-6" />
                            ごみ箱は空です
                        </div>
                    ) : (
                        <ul className="space-y-2" aria-label="ごみ箱のタスク">
                            {tasks.map((task) => (
                                <li
                                    key={task.id}
                                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-4 py-3 shadow-xs"
                                >
                                    <div className="min-w-0 flex-1 basis-52">
                                        <p className="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]">
                                            {task.title}
                                        </p>
                                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                            {task.tag && (
                                                <Badge variant="outline">
                                                    {task.tag.name}
                                                </Badge>
                                            )}
                                            {formatDateTime(task.deleted_at)}{' '}
                                            に削除
                                        </p>
                                    </div>
                                    <div className="ml-auto flex shrink-0 gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => restore(task)}
                                            aria-label={`「${task.title}」を元に戻す`}
                                        >
                                            <RotateCcw />
                                            元に戻す
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setConfirming(task)}
                                            aria-label={`「${task.title}」を完全に削除`}
                                        >
                                            <Trash2 />
                                            完全に削除
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={confirming !== null}
                onOpenChange={(open) => !open && setConfirming(null)}
                title={
                    confirming === 'all'
                        ? 'ごみ箱を空にしますか？'
                        : 'タスクを完全に削除しますか？'
                }
                description={
                    confirming === 'all'
                        ? `ごみ箱の ${tasks.length} 件のタスクを完全に削除します。元に戻すことはできません。`
                        : confirming
                          ? `「${confirming.title}」を完全に削除します。元に戻すことはできません。`
                          : undefined
                }
                confirmLabel="完全に削除する"
                onConfirm={() => {
                    if (confirming === 'all') emptyTrash();
                    else if (confirming) forceDelete(confirming);
                    setConfirming(null);
                }}
            />
        </AuthenticatedLayout>
    );
}
