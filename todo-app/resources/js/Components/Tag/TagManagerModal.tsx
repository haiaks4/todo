import { api } from '@/lib/api';
import { Tag } from '@/types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface Props {
    tags: Tag[];
    onClose: () => void;
    onChanged: () => void;
}

export default function TagManagerModal({ tags, onClose, onChanged }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);

    const createForm = useForm<{ name: string }>();
    const editForm = useForm<{ name: string }>();

    const handleCreate = async (values: { name: string }) => {
        await api.tags.create(values);
        createForm.reset();
        onChanged();
    };

    const handleEdit = async (id: number, values: { name: string }) => {
        await api.tags.update(id, values);
        setEditingId(null);
        onChanged();
    };

    const handleDelete = async (tag: Tag) => {
        if (!confirm(`タグ「${tag.name}」を削除しますか？\n関連タスクのタグは外れます。`)) return;
        await api.tags.delete(tag.id);
        onChanged();
    };

    const startEdit = (tag: Tag) => {
        setEditingId(tag.id);
        editForm.setValue('name', tag.name);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">タグ管理</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                {/* 新規作成 */}
                <form
                    onSubmit={createForm.handleSubmit(handleCreate)}
                    className="mb-4 flex gap-2"
                >
                    <input
                        {...createForm.register('name', { required: true })}
                        placeholder="新しいタグ名"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={createForm.formState.isSubmitting}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        追加
                    </button>
                </form>

                {/* タグ一覧 */}
                <ul className="space-y-2">
                    {tags.map((tag) => (
                        <li key={tag.id} className="flex items-center gap-2">
                            {editingId === tag.id ? (
                                <form
                                    onSubmit={editForm.handleSubmit((v) => handleEdit(tag.id, v))}
                                    className="flex flex-1 gap-2"
                                >
                                    <input
                                        {...editForm.register('name', { required: true })}
                                        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
                                    >
                                        保存
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                                    >
                                        キャンセル
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <span className="flex-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                                        {tag.name}
                                    </span>
                                    <button
                                        onClick={() => startEdit(tag)}
                                        className="text-gray-400 hover:text-indigo-600"
                                        title="編集"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tag)}
                                        className="text-gray-400 hover:text-red-600"
                                        title="削除"
                                    >
                                        🗑
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                    {tags.length === 0 && (
                        <li className="text-center text-sm text-gray-400">タグがありません</li>
                    )}
                </ul>

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
