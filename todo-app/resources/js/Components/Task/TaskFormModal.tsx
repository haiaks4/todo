import { api } from '@/lib/api';
import { Tag, Task } from '@/types';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface Props {
    task?: Task | null;
    tags: Tag[];
    onClose: () => void;
    onSaved: () => void;
}

interface FormValues {
    title: string;
    description: string;
    due_date: string;
    priority: string;
    status: string;
    tag_id: string;
}

export default function TaskFormModal({ task, tags, onClose, onSaved }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>();

    useEffect(() => {
        if (task) {
            reset({
                title: task.title,
                description: task.description ?? '',
                due_date: task.due_date ? task.due_date.slice(0, 16) : '',
                priority: task.priority ?? '',
                status: task.status,
                tag_id: task.tag_id?.toString() ?? '',
            });
        } else {
            reset({ title: '', description: '', due_date: '', priority: '', status: 'todo', tag_id: '' });
        }
    }, [task, reset]);

    const onSubmit = async (values: FormValues) => {
        const payload: Record<string, unknown> = {
            title: values.title,
            description: values.description || null,
            due_date: values.due_date || null,
            priority: values.priority || null,
            status: values.status,
            tag_id: values.tag_id ? Number(values.tag_id) : null,
        };

        if (task) {
            await api.tasks.update(task.id, payload);
        } else {
            await api.tasks.create(payload);
        }
        onSaved();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {task ? 'タスクを編集' : 'タスクを作成'}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* タイトル */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            タイトル <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('title', { required: 'タイトルは必須です' })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                        )}
                    </div>

                    {/* 説明 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            説明
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 期限 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                期限
                            </label>
                            <input
                                type="datetime-local"
                                {...register('due_date')}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        {/* タグ */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                タグ
                            </label>
                            <select
                                {...register('tag_id')}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">なし</option>
                                {tags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 優先度 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                優先度
                            </label>
                            <select
                                {...register('priority')}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">未設定</option>
                                <option value="high">高</option>
                                <option value="medium">中</option>
                                <option value="low">低</option>
                            </select>
                        </div>

                        {/* ステータス */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                ステータス
                            </label>
                            <select
                                {...register('status')}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="todo">未着手</option>
                                <option value="in_progress">進行中</option>
                                <option value="done">完了</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
