import { api } from '@/lib/api';
import { Task } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
    task: Task;
    selected: boolean;
    onSelect: (id: number) => void;
    onDetail: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDeleted: () => void;
    onDuplicated: () => void;
    onStatusChange: (task: Task, status: Task['status']) => void;
}

const PRIORITY_COLORS = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
} as const;

const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' } as const;

const STATUS_OPTIONS = [
    { value: 'todo', label: '未着手' },
    { value: 'in_progress', label: '進行中' },
    { value: 'done', label: '完了' },
] as const;

export default function TaskItem({
    task,
    selected,
    onSelect,
    onDetail,
    onEdit,
    onDeleted,
    onDuplicated,
    onStatusChange,
}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDuplicate = async () => {
        await api.tasks.duplicate(task.id);
        onDuplicated();
    };

    const handleDelete = async () => {
        if (!confirm(`「${task.title}」を削除しますか？`)) return;
        await api.tasks.delete(task.id);
        onDeleted();
    };

    const isOverdue =
        task.due_date &&
        task.status !== 'done' &&
        new Date(task.due_date) < new Date();

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm dark:bg-gray-800 ${
                isOverdue ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'
            }`}
        >
            {/* ドラッグハンドル */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                title="ドラッグして並び替え"
            >
                ⠿
            </button>

            {/* 一括選択チェックボックス */}
            <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelect(task.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />

            {/* タスク情報（クリックで詳細） */}
            <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => onDetail(task)}
            >
                <div className="flex items-center gap-2">
                    <span
                        className={`truncate text-sm font-medium ${
                            task.status === 'done'
                                ? 'text-gray-400 line-through'
                                : 'text-gray-900 dark:text-white'
                        }`}
                    >
                        {task.title}
                    </span>
                    {task.priority && (
                        <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}
                        >
                            {PRIORITY_LABELS[task.priority]}
                        </span>
                    )}
                    {task.tag && (
                        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                            {task.tag.name}
                        </span>
                    )}
                </div>
                {task.due_date && (
                    <div
                        className={`mt-0.5 text-xs ${
                            isOverdue ? 'font-medium text-red-500' : 'text-gray-400'
                        }`}
                    >
                        期限:{' '}
                        {new Date(task.due_date).toLocaleString('ja-JP', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                        {isOverdue && ' (期限超過)'}
                    </div>
                )}
            </div>

            {/* ステータス変更 */}
            <select
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value as Task['status'])}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {/* コピー */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate();
                }}
                className="shrink-0 text-gray-400 hover:text-indigo-600"
                title="コピーして作成"
            >
                ⧉
            </button>

            {/* 編集 */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                }}
                className="shrink-0 text-gray-400 hover:text-indigo-600"
                title="編集"
            >
                ✎
            </button>

            {/* 削除 */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                }}
                className="shrink-0 text-gray-400 hover:text-red-600"
                title="削除"
            >
                🗑
            </button>
        </div>
    );
}
