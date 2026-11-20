import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { api, getErrorMessage, getValidationErrors } from '@/lib/api';
import { isImeEnter } from '@/lib/keyboard';
import { cn } from '@/lib/utils';
import type { Subtask } from '@/types';

interface Props {
    taskId: number;
    initialSubtasks: Subtask[];
    /** 項目を変更したとき（一覧の進み具合を更新するため） */
    onChanged: () => void;
}

/**
 * タスクの中のチェック項目。追加・チェック・名前の変更・削除はその場で保存する
 * （タスク本体の「保存」ボタンを押す必要はない）。
 */
export default function SubtaskList({
    taskId,
    initialSubtasks,
    onChanged,
}: Props) {
    const [items, setItems] = useState<Subtask[]>(initialSubtasks);
    const [newTitle, setNewTitle] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const done = items.filter((i) => i.is_done).length;

    const showError = (e: unknown) =>
        toast.error(getValidationErrors(e)?.title?.[0] ?? getErrorMessage(e));

    /** 画面を先に変え、保存に失敗したら元に戻す */
    const change = async (next: Subtask[], save: () => Promise<unknown>) => {
        const prev = items;
        setItems(next);
        try {
            await save();
            onChanged();
        } catch (e) {
            setItems(prev);
            showError(e);
        }
    };

    const add = async () => {
        const title = newTitle.trim();
        if (!title || adding) return;
        setAdding(true);
        try {
            const created: Subtask = await api.subtasks.create(taskId, title);
            setItems((prev) => [...prev, created]);
            setNewTitle('');
            onChanged();
        } catch (e) {
            showError(e);
        } finally {
            setAdding(false);
        }
    };

    const toggle = (item: Subtask) =>
        change(
            items.map((i) =>
                i.id === item.id ? { ...i, is_done: !i.is_done } : i,
            ),
            () => api.subtasks.update(item.id, { is_done: !item.is_done }),
        );

    const rename = (item: Subtask) => {
        const title = editingTitle.trim();
        setEditingId(null);
        if (!title || title === item.title) return;
        change(
            items.map((i) => (i.id === item.id ? { ...i, title } : i)),
            () => api.subtasks.update(item.id, { title }),
        );
    };

    const remove = (item: Subtask) =>
        change(
            items.filter((i) => i.id !== item.id),
            () => api.subtasks.delete(item.id),
        );

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">チェックリスト</span>
                {items.length > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {done}/{items.length}
                    </span>
                )}
            </div>

            {items.length > 0 && (
                <>
                    <div
                        className="h-1 overflow-hidden rounded-full bg-muted"
                        aria-hidden
                    >
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${(done / items.length) * 100}%` }}
                        />
                    </div>
                    <ul className="space-y-0.5">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="group flex min-h-9 items-center gap-2 rounded-md pr-1 pl-1 hover:bg-muted/50"
                            >
                                <Checkbox
                                    checked={item.is_done}
                                    onCheckedChange={() => toggle(item)}
                                    aria-label={`「${item.title}」を${item.is_done ? '未完了に戻す' : '完了にする'}`}
                                />
                                {editingId === item.id ? (
                                    <Input
                                        autoFocus
                                        value={editingTitle}
                                        maxLength={255}
                                        aria-label="項目の名前"
                                        className="h-8"
                                        onChange={(e) =>
                                            setEditingTitle(e.target.value)
                                        }
                                        onBlur={() => rename(item)}
                                        onKeyDown={(e) => {
                                            if (isImeEnter(e)) return;
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                rename(item);
                                            } else if (e.key === 'Escape') {
                                                // ダイアログごと閉じないようにする
                                                e.stopPropagation();
                                                setEditingId(null);
                                            }
                                        }}
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        className={cn(
                                            'min-w-0 flex-1 py-1.5 text-left text-sm [overflow-wrap:anywhere]',
                                            item.is_done &&
                                                'text-muted-foreground line-through',
                                        )}
                                        onClick={() => {
                                            setEditingId(item.id);
                                            setEditingTitle(item.title);
                                        }}
                                        aria-label={`「${item.title}」の名前を変更`}
                                    >
                                        {item.title}
                                    </button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 text-muted-foreground sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                                    onClick={() => remove(item)}
                                    aria-label={`「${item.title}」を削除`}
                                >
                                    <X />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <div className="flex gap-2">
                <Input
                    value={newTitle}
                    maxLength={255}
                    placeholder="項目を追加"
                    aria-label="チェックリストに項目を追加"
                    enterKeyHint="enter"
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (isImeEnter(e)) return;
                        if (e.key === 'Enter') {
                            // タスクのフォームを送信しない
                            e.preventDefault();
                            add();
                        }
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={add}
                    disabled={!newTitle.trim() || adding}
                    aria-label="追加"
                >
                    <Plus />
                </Button>
            </div>
        </div>
    );
}
