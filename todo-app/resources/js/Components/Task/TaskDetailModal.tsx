import { Task } from '@/types';

interface Props {
    task: Task;
    onClose: () => void;
    onEdit: () => void;
}

const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' } as const;
const PRIORITY_COLORS = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
} as const;
const STATUS_LABELS = { todo: '未着手', in_progress: '進行中', done: '完了' } as const;
const STATUS_COLORS = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
} as const;

export default function TaskDetailModal({ task, onClose, onEdit }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="mb-4 flex items-start justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h2>
                    <button
                        onClick={onClose}
                        className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-3 text-sm">
                    {/* バッジ行 */}
                    <div className="flex flex-wrap gap-2">
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}
                        >
                            {STATUS_LABELS[task.status]}
                        </span>
                        {task.priority && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}
                            >
                                優先度: {PRIORITY_LABELS[task.priority]}
                            </span>
                        )}
                        {task.tag && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                {task.tag.name}
                            </span>
                        )}
                    </div>

                    {task.due_date && (
                        <div className="text-gray-600 dark:text-gray-400">
                            期限:{' '}
                            {new Date(task.due_date).toLocaleString('ja-JP', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                    )}

                    {task.description && (
                        <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            {task.description}
                        </div>
                    )}

                    <div className="text-xs text-gray-400">
                        作成: {new Date(task.created_at).toLocaleString('ja-JP')}
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        閉じる
                    </button>
                    <button
                        onClick={onEdit}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        編集
                    </button>
                </div>
            </div>
        </div>
    );
}
