import { Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import InputError from '@/Components/InputError';
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogDescription,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
} from '@/Components/ResponsiveDialog';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
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
import {
    formatDateTime,
    PRIORITY_OPTIONS,
    RECURRENCE_OPTIONS,
    STATUS_OPTIONS,
} from '@/lib/task';
import type { Project, Tag, Task } from '@/types';
import SubtaskList from './SubtaskList';

/** Select で「未設定」を表す値（Radix の Select は空文字を値にできない） */
const NONE = 'none';

interface FormValues {
    title: string;
    description: string;
    due_date: string;
    recurrence: string;
    priority: string;
    status: string;
    tag_id: string;
    project_id: string;
}

const toFormValues = (
    task: Task | null,
    defaultProjectId: number | null,
    defaultDueDate: string | null,
): FormValues =>
    task
        ? {
              title: task.title,
              description: task.description ?? '',
              due_date: task.due_date ? task.due_date.slice(0, 16) : '',
              recurrence: task.recurrence ?? NONE,
              priority: task.priority ?? NONE,
              status: task.status,
              tag_id: task.tag_id?.toString() ?? NONE,
              project_id: task.project_id?.toString() ?? NONE,
          }
        : {
              title: '',
              description: '',
              due_date: defaultDueDate ?? '',
              recurrence: NONE,
              priority: NONE,
              status: 'todo',
              tag_id: NONE,
              project_id: defaultProjectId?.toString() ?? NONE,
          };

const toPayload = (values: FormValues): Record<keyof FormValues, unknown> => ({
    title: values.title,
    description: values.description || null,
    due_date: values.due_date || null,
    // 期限が無いときは繰り返さない
    recurrence:
        values.recurrence === NONE || !values.due_date
            ? null
            : values.recurrence,
    priority: values.priority === NONE ? null : values.priority,
    status: values.status,
    tag_id: values.tag_id === NONE ? null : Number(values.tag_id),
    project_id: values.project_id === NONE ? null : Number(values.project_id),
});

interface FormProps {
    /** 編集するタスク。null のときは新規作成 */
    task: Task | null;
    tags: Tag[];
    projects: Project[];
    /** 新規作成のときに最初から選んでおくプロジェクト */
    defaultProjectId: number | null;
    /** 新規作成のときに最初から入れておく期限（「2026-11-20T23:59」の形式） */
    defaultDueDate: string | null;
    onSaved: () => void;
    onCancel: () => void;
    onDelete: (task: Task) => void;
    /** 未保存の変更があるかどうかを親に伝える（閉じる前の確認に使う） */
    onDirtyChange: (dirty: boolean) => void;
    /** チェックリストを変更したとき（その場で保存される） */
    onSubtasksChanged: () => void;
}

/** タスクの作成・編集フォーム（ダイアログ・シート・横のパネルで共通） */
function TaskForm({
    task,
    tags,
    projects,
    defaultProjectId,
    defaultDueDate,
    onSaved,
    onCancel,
    onDelete,
    onDirtyChange,
    onSubtasksChanged,
}: FormProps) {
    const {
        register,
        control,
        handleSubmit,
        setError,
        setValue,
        watch,
        formState: { errors, isSubmitting, isDirty, dirtyFields },
    } = useForm<FormValues>({
        defaultValues: toFormValues(task, defaultProjectId, defaultDueDate),
    });

    // 期限を消したら、繰り返しも解除する
    const hasDueDate = !!watch('due_date');
    useEffect(() => {
        if (!hasDueDate) {
            setValue('recurrence', NONE, { shouldDirty: true });
        }
    }, [hasDueDate, setValue]);

    useEffect(() => {
        onDirtyChange(isDirty);
    }, [isDirty, onDirtyChange]);

    const onSubmit = async (values: FormValues) => {
        const all = toPayload(values);
        // 編集では変更した項目だけを送る（一覧で変えたステータスなどを上書きしないため）
        const payload = task
            ? Object.fromEntries(
                  Object.entries(all).filter(
                      ([key]) => dirtyFields[key as keyof FormValues],
                  ),
              )
            : all;

        try {
            if (task) {
                if (Object.keys(payload).length > 0) {
                    await api.tasks.update(task.id, payload);
                }
            } else {
                await api.tasks.create(payload);
            }
        } catch (e) {
            const validationErrors = getValidationErrors(e);
            if (validationErrors) {
                for (const [field, messages] of Object.entries(
                    validationErrors,
                )) {
                    const name = (
                        field in all ? field : 'root.server'
                    ) as keyof FormValues;
                    setError(name, { type: 'server', message: messages[0] });
                }
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
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="@container space-y-5"
        >
            {/* タイトル */}
            <div className="space-y-2">
                <Label htmlFor="task-title">
                    タイトル <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="task-title"
                    autoFocus={!task}
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

            {/* チェックリスト（編集時のみ。項目はその場で保存される） */}
            {task ? (
                <SubtaskList
                    taskId={task.id}
                    initialSubtasks={task.subtasks ?? []}
                    onChanged={onSubtasksChanged}
                />
            ) : (
                <p className="text-xs text-muted-foreground">
                    チェックリストは、タスクを保存したあとに編集画面から追加できます。
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
                {/* プロジェクト */}
                <div className="space-y-2">
                    <Label htmlFor="task-project">プロジェクト</Label>
                    <Controller
                        control={control}
                        name="project_id"
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger
                                    id="task-project"
                                    className="w-full"
                                    aria-invalid={!!errors.project_id}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE}>
                                        なし（インボックス）
                                    </SelectItem>
                                    {projects.map((project) => (
                                        <SelectItem
                                            key={project.id}
                                            value={project.id.toString()}
                                        >
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    <InputError message={errors.project_id?.message} />
                </div>

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

                {/* 繰り返し */}
                <div className="space-y-2">
                    <Label htmlFor="task-recurrence">繰り返し</Label>
                    <Controller
                        control={control}
                        name="recurrence"
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!hasDueDate}
                            >
                                <SelectTrigger
                                    id="task-recurrence"
                                    className="w-full"
                                    aria-invalid={!!errors.recurrence}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE}>
                                        繰り返さない
                                    </SelectItem>
                                    {RECURRENCE_OPTIONS.map((opt) => (
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
                    {hasDueDate ? (
                        <InputError message={errors.recurrence?.message} />
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            期限を設定すると選べます
                        </p>
                    )}
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
                                    <SelectItem value={NONE}>なし</SelectItem>
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
                                    <SelectItem value={NONE}>未設定</SelectItem>
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

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">
                {task && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
                        onClick={() => onDelete(task)}
                    >
                        <Trash2 />
                        削除
                    </Button>
                )}
                <Button type="button" variant="outline" onClick={onCancel}>
                    キャンセル
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '保存中...' : '保存'}
                </Button>
            </div>
        </form>
    );
}

interface EditorProps extends Omit<FormProps, 'onCancel'> {
    /** 閉じる操作（未保存の変更があるときは親が確認を出す） */
    onRequestClose: () => void;
}

const headerTitle = (task: Task | null) =>
    task ? 'タスクを編集' : 'タスクを作成';

const headerDescription = (task: Task | null) =>
    task ? (
        `作成日時：${formatDateTime(task.created_at, { year: true })}`
    ) : (
        <>
            <span className="text-destructive">*</span> は必須項目です。
        </>
    );

/** スマホでは下から出るシート、タブレットでは中央のダイアログで開く */
export function TaskEditorDialog({
    open,
    onRequestClose,
    ...props
}: EditorProps & { open: boolean }) {
    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={(next) => !next && onRequestClose()}
        >
            <ResponsiveDialogContent
                className="sm:max-w-lg"
                // 編集のときは、開いた瞬間にキーボードが出ないようにする
                onOpenAutoFocus={(e) => props.task && e.preventDefault()}
            >
                <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle>
                        {headerTitle(props.task)}
                    </ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                        {headerDescription(props.task)}
                    </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <TaskForm {...props} onCancel={onRequestClose} />
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
}

/** 横幅が広い画面で、一覧の横に並べて表示するパネル */
export function TaskEditorPanel({ onRequestClose, ...props }: EditorProps) {
    return (
        <section
            aria-label={headerTitle(props.task)}
            className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border bg-card p-5 shadow-sm"
        >
            <div className="mb-5 flex items-start justify-between gap-2">
                <div className="space-y-1">
                    <h2 className="font-heading text-base font-medium">
                        {headerTitle(props.task)}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {headerDescription(props.task)}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRequestClose}
                    aria-label="閉じる"
                >
                    <X />
                </Button>
            </div>
            <TaskForm {...props} onCancel={onRequestClose} />
        </section>
    );
}
