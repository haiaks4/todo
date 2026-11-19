import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import InputError from '@/Components/InputError';
import { Alert, AlertDescription } from '@/Components/ui/alert';
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
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { api, getErrorMessage, getValidationErrors } from '@/lib/api';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/task';
import type { Tag, Task } from '@/types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 編集するタスク。null のときは新規作成 */
    task: Task | null;
    tags: Tag[];
    onSaved: () => void;
}

/** Select で「未設定」を表す値（Radix の Select は空文字を値にできない） */
const NONE = 'none';

interface FormValues {
    title: string;
    description: string;
    due_date: string;
    priority: string;
    status: string;
    tag_id: string;
}

const toFormValues = (task: Task | null): FormValues =>
    task
        ? {
              title: task.title,
              description: task.description ?? '',
              due_date: task.due_date ? task.due_date.slice(0, 16) : '',
              priority: task.priority ?? NONE,
              status: task.status,
              tag_id: task.tag_id?.toString() ?? NONE,
          }
        : {
              title: '',
              description: '',
              due_date: '',
              priority: NONE,
              status: 'todo',
              tag_id: NONE,
          };

export default function TaskFormDialog({
    open,
    onOpenChange,
    task,
    tags,
    onSaved,
}: Props) {
    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ defaultValues: toFormValues(task) });

    // ダイアログを開くたびに対象タスクの値で初期化する
    useEffect(() => {
        if (open) reset(toFormValues(task));
    }, [open, task, reset]);

    const onSubmit = async (values: FormValues) => {
        const payload: Record<string, unknown> = {
            title: values.title,
            description: values.description || null,
            due_date: values.due_date || null,
            priority: values.priority === NONE ? null : values.priority,
            status: values.status,
            tag_id: values.tag_id === NONE ? null : Number(values.tag_id),
        };

        try {
            if (task) {
                await api.tasks.update(task.id, payload);
            } else {
                await api.tasks.create(payload);
            }
        } catch (e) {
            const validationErrors = getValidationErrors(e);
            if (validationErrors) {
                Object.entries(validationErrors).forEach(
                    ([field, messages]) => {
                        const name = (
                            field in payload ? field : 'root.server'
                        ) as keyof FormValues;
                        setError(name, {
                            type: 'server',
                            message: messages[0],
                        });
                    },
                );
            } else {
                setError('root.server', {
                    type: 'server',
                    message: getErrorMessage(e),
                });
            }
            return;
        }

        toast.success(
            task ? 'タスクを更新しました。' : 'タスクを作成しました。',
        );
        onSaved();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {task ? 'タスクを編集' : 'タスクを作成'}
                        </DialogTitle>
                        <DialogDescription>
                            <span className="text-destructive">*</span>{' '}
                            は必須項目です。
                        </DialogDescription>
                    </DialogHeader>

                    {/* タイトル */}
                    <div className="space-y-2">
                        <Label htmlFor="task-title">
                            タイトル <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="task-title"
                            autoFocus
                            aria-invalid={!!errors.title}
                            {...register('title', {
                                required: 'タイトルは必須です。',
                                maxLength: {
                                    value: 255,
                                    message:
                                        'タイトルは255文字以内で入力してください。',
                                },
                            })}
                        />
                        <InputError message={errors.title?.message} />
                    </div>

                    {/* 説明 */}
                    <div className="space-y-2">
                        <Label htmlFor="task-description">説明</Label>
                        <Textarea
                            id="task-description"
                            rows={3}
                            aria-invalid={!!errors.description}
                            {...register('description')}
                        />
                        <InputError message={errors.description?.message} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* 期限 */}
                        <div className="space-y-2">
                            <Label htmlFor="task-due-date">期限</Label>
                            <Input
                                id="task-due-date"
                                type="datetime-local"
                                aria-invalid={!!errors.due_date}
                                {...register('due_date')}
                            />
                            <InputError message={errors.due_date?.message} />
                        </div>

                        {/* タグ */}
                        <div className="space-y-2">
                            <Label htmlFor="task-tag">タグ</Label>
                            <Controller
                                control={control}
                                name="tag_id"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            id="task-tag"
                                            className="w-full"
                                            aria-invalid={!!errors.tag_id}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE}>
                                                なし
                                            </SelectItem>
                                            {tags.map((tag) => (
                                                <SelectItem
                                                    key={tag.id}
                                                    value={tag.id.toString()}
                                                >
                                                    {tag.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <InputError message={errors.tag_id?.message} />
                        </div>

                        {/* 優先度 */}
                        <div className="space-y-2">
                            <Label htmlFor="task-priority">優先度</Label>
                            <Controller
                                control={control}
                                name="priority"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            id="task-priority"
                                            className="w-full"
                                            aria-invalid={!!errors.priority}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE}>
                                                未設定
                                            </SelectItem>
                                            {PRIORITY_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <InputError message={errors.priority?.message} />
                        </div>

                        {/* ステータス */}
                        <div className="space-y-2">
                            <Label htmlFor="task-status">ステータス</Label>
                            <Controller
                                control={control}
                                name="status"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            id="task-status"
                                            className="w-full"
                                            aria-invalid={!!errors.status}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <InputError message={errors.status?.message} />
                        </div>
                    </div>

                    {errors.root?.server && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {errors.root.server.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? '保存中...' : '保存'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
