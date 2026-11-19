import ConfirmDialog from '@/Components/ConfirmDialog';
import TagManagerDialog from '@/Components/Tag/TagManagerDialog';
import TaskDetailDialog from '@/Components/Task/TaskDetailDialog';
import TaskFormDialog from '@/Components/Task/TaskFormDialog';
import TaskItem from '@/Components/Task/TaskItem';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { api, fetcher, getErrorMessage } from '@/lib/api';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/task';
import { Status, Tag, Task } from '@/types';
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
import { Plus, RotateCw, Search, Tags, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

/** Select で「すべて」を表す値（Radix の Select は空文字を値にできない） */
const ALL = 'all';

export default function TaskIndex() {
    // フィルター状態
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState(ALL);
    const [filterTagId, setFilterTagId] = useState(ALL);
    const [filterPriority, setFilterPriority] = useState(ALL);

    // ダイアログ状態
    const [formOpen, setFormOpen] = useState(false);
    const [tagManagerOpen, setTagManagerOpen] = useState(false);
    const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [detailTask, setDetailTask] = useState<Task | null>(null);

    // 一括選択
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // ローカルタスクリスト（D&D用）
    const [localTasks, setLocalTasks] = useState<Task[]>([]);

    // 検索入力はキー入力ごとにリクエストしないよう遅延させる
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // SWRでタスク取得
    const taskParams = new URLSearchParams();
    if (debouncedSearch) taskParams.set('search', debouncedSearch);
    if (filterStatus !== ALL) taskParams.set('status', filterStatus);
    if (filterTagId !== ALL) taskParams.set('tag_id', filterTagId);
    if (filterPriority !== ALL) taskParams.set('priority', filterPriority);

    const {
        data: tasks,
        error: tasksError,
        mutate: mutateTasks,
        isLoading: tasksLoading,
    } = useSWR<Task[]>(`/api/tasks?${taskParams.toString()}`, fetcher, {
        keepPreviousData: true,
    });

    const { data: tags, mutate: mutateTags } = useSWR<Tag[]>(
        '/api/tags',
        fetcher,
    );

    // 絞り込み中のタグが削除されたら、タグの絞り込みを解除する
    useEffect(() => {
        if (
            tags &&
            filterTagId !== ALL &&
            !tags.some((t) => t.id.toString() === filterTagId)
        ) {
            setFilterTagId(ALL);
        }
    }, [tags, filterTagId]);

    // SWRデータが変わったらローカル状態に同期し、表示外になった選択は解除する
    useEffect(() => {
        if (!tasks) return;
        setLocalTasks(tasks);
        const visibleIds = new Set(tasks.map((t) => t.id));
        setSelectedIds((prev) => {
            const next = prev.filter((id) => visibleIds.has(id));
            return next.length === prev.length ? prev : next;
        });
    }, [tasks]);

    // 最新のローカルリストを D&D ハンドラから参照する
    const localTasksRef = useRef<Task[]>(localTasks);
    localTasksRef.current = localTasks;

    // D&Dセンサー（クリックと区別するため、少し動かしてからドラッグ開始）
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const prev = localTasksRef.current;
            const oldIndex = prev.findIndex((t) => t.id === active.id);
            const newIndex = prev.findIndex((t) => t.id === over.id);
            if (oldIndex < 0 || newIndex < 0) return;

            const next = arrayMove(prev, oldIndex, newIndex);
            setLocalTasks(next);

            // DBに保存（失敗したらサーバーの状態に戻す）
            try {
                await api.tasks.reorder(next.map((t) => t.id));
                mutateTasks(next, { revalidate: false });
            } catch (e) {
                toast.error(getErrorMessage(e));
                setLocalTasks(prev);
                mutateTasks();
            }
        },
        [mutateTasks],
    );

    const handleStatusChange = async (task: Task, status: Status) => {
        try {
            await api.tasks.update(task.id, { status });
        } catch (e) {
            toast.error(getErrorMessage(e));
        }
        mutateTasks();
    };

    const handleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const allSelected =
        localTasks.length > 0 && selectedIds.length === localTasks.length;

    const handleSelectAll = () => {
        setSelectedIds(allSelected ? [] : localTasks.map((t) => t.id));
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            await api.tasks.bulkDelete(selectedIds);
            toast.success(`${selectedIds.length} 件のタスクを削除しました。`);
            setSelectedIds([]);
        } catch (e) {
            toast.error(getErrorMessage(e));
        }
        mutateTasks();
    };

    const openCreate = () => {
        setEditingTask(null);
        setFormOpen(true);
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setDetailTask(null);
        setFormOpen(true);
    };

    const isFiltered =
        search !== '' ||
        filterStatus !== ALL ||
        filterTagId !== ALL ||
        filterPriority !== ALL;

    const clearFilters = () => {
        setSearch('');
        setFilterStatus(ALL);
        setFilterTagId(ALL);
        setFilterPriority(ALL);
    };

    return (
        <AuthenticatedLayout header="タスク管理">
            <Head title="タスク管理" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
                    {/* ツールバー */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={openCreate}>
                            <Plus />
                            タスクを作成
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setTagManagerOpen(true)}
                        >
                            <Tags />
                            タグ管理
                        </Button>
                        {selectedIds.length > 0 && (
                            <Button
                                variant="destructive"
                                className="ml-auto"
                                onClick={() => setConfirmingBulkDelete(true)}
                            >
                                <Trash2 />
                                選択したタスクを削除（{selectedIds.length}）
                            </Button>
                        )}
                    </div>

                    {/* 検索・絞り込み */}
                    <div className="flex flex-wrap gap-2">
                        <div className="relative min-w-48 flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="タスクを検索..."
                                aria-label="タスクを検索"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-background pl-8"
                            />
                        </div>

                        <Select
                            value={filterStatus}
                            onValueChange={setFilterStatus}
                        >
                            <SelectTrigger
                                className="w-auto min-w-36 bg-background"
                                aria-label="ステータスで絞り込み"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    ステータス：すべて
                                </SelectItem>
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

                        <Select
                            value={filterPriority}
                            onValueChange={setFilterPriority}
                        >
                            <SelectTrigger
                                className="w-auto min-w-36 bg-background"
                                aria-label="優先度で絞り込み"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    優先度：すべて
                                </SelectItem>
                                {PRIORITY_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        優先度 {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterTagId}
                            onValueChange={setFilterTagId}
                        >
                            <SelectTrigger
                                className="w-auto min-w-36 bg-background"
                                aria-label="タグで絞り込み"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    タグ：すべて
                                </SelectItem>
                                {tags?.map((tag) => (
                                    <SelectItem
                                        key={tag.id}
                                        value={tag.id.toString()}
                                    >
                                        {tag.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isFiltered && (
                            <Button variant="ghost" onClick={clearFilters}>
                                条件をクリア
                            </Button>
                        )}
                    </div>

                    {/* 全選択 */}
                    {localTasks.length > 0 && (
                        <div className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
                            <Checkbox
                                id="select-all"
                                checked={
                                    allSelected
                                        ? true
                                        : selectedIds.length > 0
                                          ? 'indeterminate'
                                          : false
                                }
                                onCheckedChange={handleSelectAll}
                            />
                            <label htmlFor="select-all">すべて選択</label>
                            <span className="ml-auto">
                                {localTasks.length} 件
                            </span>
                        </div>
                    )}

                    {/* タスクリスト */}
                    {tasksError && !tasks ? (
                        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-8 text-sm text-destructive">
                            {getErrorMessage(tasksError)}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => mutateTasks()}
                            >
                                <RotateCw />
                                再読み込み
                            </Button>
                        </div>
                    ) : tasksLoading && !tasks ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            読み込み中...
                        </div>
                    ) : localTasks.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
                            {isFiltered ? (
                                <>
                                    条件に一致するタスクがありません
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        条件をクリア
                                    </Button>
                                </>
                            ) : (
                                <>
                                    タスクがありません
                                    <Button size="sm" onClick={openCreate}>
                                        <Plus />
                                        最初のタスクを作成
                                    </Button>
                                </>
                            )}
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
                                            selected={selectedIds.includes(
                                                task.id,
                                            )}
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

            <TaskFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                task={editingTask}
                tags={tags ?? []}
                onSaved={() => mutateTasks()}
            />

            <TaskDetailDialog
                task={detailTask}
                onOpenChange={(open) => !open && setDetailTask(null)}
                onEdit={openEdit}
            />

            <TagManagerDialog
                open={tagManagerOpen}
                onOpenChange={setTagManagerOpen}
                tags={tags ?? []}
                onChanged={() => {
                    mutateTags();
                    mutateTasks();
                }}
            />

            <ConfirmDialog
                open={confirmingBulkDelete}
                onOpenChange={setConfirmingBulkDelete}
                title="選択したタスクを削除しますか？"
                description={`${selectedIds.length} 件のタスクを削除します。`}
                onConfirm={handleBulkDelete}
            />
        </AuthenticatedLayout>
    );
}
