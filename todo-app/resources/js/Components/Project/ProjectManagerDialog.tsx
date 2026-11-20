import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import type { Project } from '@/types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projects: Project[];
    onChanged: () => void;
}

const NAME_RULES = { required: true, maxLength: 50 } as const;

export default function ProjectManagerDialog({
    open,
    onOpenChange,
    projects,
    onChanged,
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingProject, setDeletingProject] = useState<Project | null>(
        null,
    );
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
            await api.projects.create(values);
            createForm.reset();
            onChanged();
        } catch (e) {
            setErrorMessage(toMessage(e));
        }
    };

    const handleEdit = async (id: number, values: { name: string }) => {
        setErrorMessage(null);
        try {
            await api.projects.update(id, values);
            setEditingId(null);
            onChanged();
        } catch (e) {
            setErrorMessage(toMessage(e));
        }
    };

    const handleDelete = async (project: Project) => {
        setErrorMessage(null);
        try {
            await api.projects.delete(project.id);
            toast.success(`プロジェクト「${project.name}」を削除しました。`);
            onChanged();
        } catch (e) {
            setErrorMessage(toMessage(e));
        }
    };

    const startEdit = (project: Project) => {
        setErrorMessage(null);
        setEditingId(project.id);
        editForm.reset({ name: project.name });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={changeOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>プロジェクトの管理</DialogTitle>
                        <DialogDescription>
                            タスクをまとめるプロジェクトを追加・編集できます。
                        </DialogDescription>
                    </DialogHeader>

                    {/* 新規作成 */}
                    <form
                        onSubmit={createForm.handleSubmit(handleCreate)}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="新しいプロジェクト名"
                            maxLength={50}
                            aria-label="新しいプロジェクト名"
                            {...createForm.register('name', NAME_RULES)}
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

                    {/* プロジェクト一覧 */}
                    <ul className="max-h-72 space-y-1 overflow-y-auto">
                        {projects.map((project) => (
                            <li
                                key={project.id}
                                className="flex items-center gap-2"
                            >
                                {editingId === project.id ? (
                                    <form
                                        onSubmit={editForm.handleSubmit((v) =>
                                            handleEdit(project.id, v),
                                        )}
                                        className="flex flex-1 items-center gap-1"
                                    >
                                        <Input
                                            autoFocus
                                            maxLength={50}
                                            aria-label="プロジェクト名"
                                            {...editForm.register(
                                                'name',
                                                NAME_RULES,
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
                                            {project.name}
                                        </Badge>
                                        <span className="flex-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`「${project.name}」を編集`}
                                            onClick={() => startEdit(project)}
                                        >
                                            <Pencil />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-destructive hover:text-destructive"
                                            aria-label={`「${project.name}」を削除`}
                                            onClick={() =>
                                                setDeletingProject(project)
                                            }
                                        >
                                            <Trash2 />
                                        </Button>
                                    </>
                                )}
                            </li>
                        ))}
                        {projects.length === 0 && (
                            <li className="py-6 text-center text-sm text-muted-foreground">
                                プロジェクトがありません
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
                open={deletingProject !== null}
                onOpenChange={(next) => !next && setDeletingProject(null)}
                title="プロジェクトを削除しますか？"
                description={
                    deletingProject
                        ? `プロジェクト「${deletingProject.name}」を削除します。中のタスクはインボックス（プロジェクトなし）に移ります。`
                        : undefined
                }
                onConfirm={() =>
                    deletingProject && handleDelete(deletingProject)
                }
            />
        </>
    );
}
