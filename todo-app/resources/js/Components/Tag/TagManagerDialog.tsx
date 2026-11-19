import ConfirmDialog from '@/Components/ConfirmDialog';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { api, getErrorMessage, getValidationErrors } from '@/lib/api';
import { Tag } from '@/types';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tags: Tag[];
    onChanged: () => void;
}

const TAG_NAME_RULES = { required: true, maxLength: 50 } as const;

export default function TagManagerDialog({
    open,
    onOpenChange,
    tags,
    onChanged,
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const createForm = useForm<{ name: string }>({
        defaultValues: { name: '' },
    });
    const editForm = useForm<{ name: string }>({ defaultValues: { name: '' } });

    const toMessage = (e: unknown) =>
        getValidationErrors(e)?.name?.[0] ?? getErrorMessage(e);

    const changeOpen = (next: boolean) => {
        if (!next) {
            setEditingId(null);
            setErrorMessage(null);
            createForm.reset();
        }
        onOpenChange(next);
    };

    const handleCreate = async (values: { name: string }) => {
        setErrorMessage(null);
        try {
            await api.tags.create(values);
            createForm.reset();
            onChanged();
        } catch (e) {
            setErrorMessage(toMessage(e));
        }
    };

    const handleEdit = async (id: number, values: { name: string }) => {
        setErrorMessage(null);
        try {
            await api.tags.update(id, values);
            setEditingId(null);
            onChanged();
        } catch (e) {
            setErrorMessage(toMessage(e));
        }
    };

    const handleDelete = async (tag: Tag) => {
        setErrorMessage(null);
        try {
            await api.tags.delete(tag.id);
            toast.success(`タグ「${tag.name}」を削除しました。`);
            onChanged();
        } catch (e) {
            setErrorMessage(toMessage(e));
        }
    };

    const startEdit = (tag: Tag) => {
        setErrorMessage(null);
        setEditingId(tag.id);
        editForm.reset({ name: tag.name });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={changeOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>タグ管理</DialogTitle>
                        <DialogDescription>
                            タスクの分類に使うタグを追加・編集できます。
                        </DialogDescription>
                    </DialogHeader>

                    {/* 新規作成 */}
                    <form
                        onSubmit={createForm.handleSubmit(handleCreate)}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="新しいタグ名"
                            maxLength={50}
                            aria-label="新しいタグ名"
                            {...createForm.register('name', TAG_NAME_RULES)}
                        />
                        <Button
                            type="submit"
                            disabled={createForm.formState.isSubmitting}
                        >
                            <Plus />
                            追加
                        </Button>
                    </form>

                    {errorMessage && (
                        <Alert variant="destructive">
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {/* タグ一覧 */}
                    <ul className="max-h-72 space-y-1 overflow-y-auto">
                        {tags.map((tag) => (
                            <li
                                key={tag.id}
                                className="flex items-center gap-2"
                            >
                                {editingId === tag.id ? (
                                    <form
                                        onSubmit={editForm.handleSubmit((v) =>
                                            handleEdit(tag.id, v),
                                        )}
                                        className="flex flex-1 items-center gap-1"
                                    >
                                        <Input
                                            autoFocus
                                            maxLength={50}
                                            aria-label="タグ名"
                                            {...editForm.register(
                                                'name',
                                                TAG_NAME_RULES,
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            aria-label="保存"
                                        >
                                            <Check />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="キャンセル"
                                            onClick={() => setEditingId(null)}
                                        >
                                            <X />
                                        </Button>
                                    </form>
                                ) : (
                                    <>
                                        <Badge
                                            variant="outline"
                                            className="h-7 px-3 text-sm"
                                        >
                                            {tag.name}
                                        </Badge>
                                        <span className="flex-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`「${tag.name}」を編集`}
                                            onClick={() => startEdit(tag)}
                                        >
                                            <Pencil />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-destructive hover:text-destructive"
                                            aria-label={`「${tag.name}」を削除`}
                                            onClick={() => setDeletingTag(tag)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </>
                                )}
                            </li>
                        ))}
                        {tags.length === 0 && (
                            <li className="py-6 text-center text-sm text-muted-foreground">
                                タグがありません
                            </li>
                        )}
                    </ul>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => changeOpen(false)}
                        >
                            閉じる
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deletingTag !== null}
                onOpenChange={(next) => !next && setDeletingTag(null)}
                title="タグを削除しますか？"
                description={
                    deletingTag
                        ? `タグ「${deletingTag.name}」を削除します。このタグが付いたタスクからはタグが外れます。`
                        : undefined
                }
                onConfirm={() => deletingTag && handleDelete(deletingTag)}
            />
        </>
    );
}
