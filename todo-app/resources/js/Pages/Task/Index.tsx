import TagManagerModal from '@/Components/Tag/TagManagerModal';
import TaskDetailModal from '@/Components/Task/TaskDetailModal';
import TaskFormModal from '@/Components/Task/TaskFormModal';
import TaskItem from '@/Components/Task/TaskItem';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { api } from '@/lib/api';
import { Tag, Task } from '@/types';
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) =>
    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).then((r) => r.json());

type FilterStatus = '' | 'todo' | 'in_progress' | 'done';
type FilterPriority = '' | 'high' | 'medium' | 'low';

export default function TaskIndex() {
    // フィルター状態
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
    const [filterTagId, setFilterTagId] = useState('');
    const [filterPriority, setFilterPriority] = useState<FilterPriority>('');

    // モーダル状態
    const [showForm, setShowForm] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [detailTask, setDetailTask] = useState<Task | null>(null);

    // 一括選択
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // ローカルタスクリスト（D&D用）
    const [localTasks, setLocalTasks] = useState<Task[]>([]);

    // SWRでタスク取得
    const taskParams = new URLSearchParams();
    if (search) taskParams.set('search', search);
    if (filterStatus) taskParams.set('status', filterStatus);
    if (filterTagId) taskParams.set('tag_id', filterTagId);
    if (filterPriority) taskParams.set('priority', filterPriority);

    const {
        data: tasks,
        mutate: mutateTasks,
        isLoading: tasksLoading,
    } = useSWR<Task[]>(`/api/tasks?${taskParams.toString()}`, fetcher);

    const { data: tags, mutate: mutateTags } = useSWR<Tag[]>('/api/tags', fetcher);

    // SWRデータが変わったらローカル状態に同期
    useEffect(() => {
        if (tasks) setLocalTasks(tasks);
    }, [tasks]);

    // D&Dセンサー
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            setLocalTasks((prev) => {
                const oldIndex = prev.findIndex((t) => t.id === active.id);
                const newIndex = prev.findIndex((t) => t.id === over.id);
                const next = arrayMove(prev, oldIndex, newIndex);
                // DBに保存
                api.tasks.reorder(next.map((t) => t.id));
                return next;
            });
        },
        [],
    );

    const handleStatusChange = async (task: Task, status: Task['status']) => {
        await api.tasks.update(task.id, { status });
        mutateTasks();
    };

    const handleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleSelectAll = () => {
        if (!localTasks) return;
        if (selectedIds.length === localTasks.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(localTasks.map((t) => t.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`選択した ${selectedIds.length} 件のタスクを削除しますか？`)) return;
        await api.tasks.bulkDelete(selectedIds);
        setSelectedIds([]);
        mutateTasks();
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setDetailTask(null);
        setShowForm(true);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    タスク管理
                </h2>
            }
        >
            <Head title="タスク管理" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

                    {/* ツールバー */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => {
                                setEditingTask(null);
                                setShowForm(true);
                            }}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            + タスク作成
                        </button>
                        <button
                            onClick={() => setShowTagManager(true)}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            タグ管理
                        </button>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                選択削除 ({selectedIds.length})
                            </button>
                        )}
                    </div>

                    {/* 検索・フィルター */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        <input
                            type="text"
                            placeholder="タスクを検索..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                            className="min-w-[7.5rem] rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">全ステータス</option>
                            <option value="todo">未着手</option>
                            <option value="in_progress">進行中</option>
                            <option value="done">完了</option>
                        </select>

                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                            className="min-w-[6.5rem] rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">全優先度</option>
                            <option value="high">高</option>
                            <option value="medium">中</option>
                            <option value="low">低</option>
                        </select>

                        <select
                            value={filterTagId}
                            onChange={(e) => setFilterTagId(e.target.value)}
                            className="min-w-[6.5rem] rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">全タグ</option>
                            {tags?.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                    {tag.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 全選択 */}
                    {localTasks.length > 0 && (
                        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                            <input
                                type="checkbox"
                                checked={
                                    localTasks.length > 0 &&
                                    selectedIds.length === localTasks.length
                                }
                                onChange={handleSelectAll}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                            />
                            <span>全選択</span>
                            <span className="ml-auto">{localTasks.length} 件</span>
                        </div>
                    )}

                    {/* タスクリスト */}
                    {tasksLoading ? (
                        <div className="py-12 text-center text-gray-400">読み込み中...</div>
                    ) : localTasks.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-400 dark:border-gray-600">
                            タスクがありません
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={localTasks.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {localTasks.map((task) => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            selected={selectedIds.includes(task.id)}
                                            onSelect={handleSelect}
                                            onDetail={setDetailTask}
                                            onEdit={openEdit}
                                            onDeleted={() => mutateTasks()}
                                            onDuplicated={() => mutateTasks()}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* モーダル群 */}
            {showForm && (
                <TaskFormModal
                    task={editingTask}
                    tags={tags ?? []}
                    onClose={() => {
                        setShowForm(false);
                        setEditingTask(null);
                    }}
                    onSaved={() => mutateTasks()}
                />
            )}

            {detailTask && (
                <TaskDetailModal
                    task={detailTask}
                    onClose={() => setDetailTask(null)}
                    onEdit={() => openEdit(detailTask)}
                />
            )}

            {showTagManager && (
                <TagManagerModal
                    tags={tags ?? []}
                    onClose={() => setShowTagManager(false)}
                    onChanged={() => {
                        mutateTags();
                        mutateTasks();
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
}
