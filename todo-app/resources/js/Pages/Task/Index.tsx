import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Head } from '@inertiajs/react';
import {
    ArrowDownWideNarrow,
    ArrowUpDown,
    Check,
    CheckCheck,
    ChevronRight,
    ListChecks,
    Plus,
    RotateCw,
    Search,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import ConfirmDialog from '@/Components/ConfirmDialog';
import TagManagerDialog from '@/Components/Tag/TagManagerDialog';
import QuickAddInput from '@/Components/Task/QuickAddInput';
import {
    TaskEditorDialog,
    TaskEditorPanel,
} from '@/Components/Task/TaskEditor';
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
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePersistentState } from '@/hooks/usePersistentState';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { api, fetcher, getErrorMessage } from '@/lib/api';
import {
    DUE_BUCKETS,
    DUE_VIEWS,
    type DueView,
    getDueBucket,
    matchesDueView,
} from '@/lib/due';
import {
    isSortKey,
    PRIORITY_OPTIONS,
    SORT_OPTIONS,
    type SortKey,
    STATUS_OPTIONS,
} from '@/lib/task';
import { cn } from '@/lib/utils';
import type { Status, Tag, Task } from '@/types';

/** Select で「すべて」を表す値（Radix の Select は空文字を値にできない） */
const ALL = 'all';

export default function TaskIndex() {
    // フィルター状態
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState(ALL);
    const [filterTagId, setFilterTagId] = useState(ALL);
    const [filterPriority, setFilterPriority] = useState(ALL);
    // 並べ替え（端末ごとに覚えておく）
    const [sort, setSort] = usePersistentState<SortKey>(
        'tasks.sort',
        'manual',
        isSortKey,
    );
    const manualSort = sort === 'manual';
    // 期限による表示の切り替え（すべて・期限切れ・今日・今週・期限なし）
    const [dueView, setDueView] = useState<DueView>('all');

    // ダイアログ状態
    const [tagManagerOpen, setTagManagerOpen] = useState(false);

    // 作成・編集画面（key は開くたびにフォームを初期化するために使う）
    const [editor, setEditor] = useState<{
        open: boolean;
        task: Task | null;
        key: number;
    }>({ open: false, task: null, key: 0 });
    const [editorDirty, setEditorDirty] = useState(false);
    // 未保存の変更を破棄してよいか確認中の操作
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(
        null,
    );
    // 横幅が広い画面では、作成・編集画面を一覧の横に並べる
    const wide = useMediaQuery('(min-width: 1024px)');
    const panelOpen = wide && editor.open;

    // 一括選択（スマホでは長押しか「選択」ボタンで選択モードに入る）
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectModeOn, setSelectModeOn] = useState(false);
    const selecting = selectModeOn || selectedIds.length > 0;

    // 並び替えモード（スマホでドラッグハンドルを表示する）
    const [reordering, setReordering] = useState(false);

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
    if (!manualSort) taskParams.set('sort', sort);

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

    // タブで選んだ期限の表示に絞ったタスク
    const now = new Date();
    const visibleTasks = localTasks.filter((t) =>
        matchesDueView(t, dueView, now),
    );
    // 完了したタスクは一覧の下に折りたたむ（「完了」で絞り込んでいるときを除く）
    const [showDone, setShowDone] = usePersistentState('tasks.showDone', false);
    const separateDone = filterStatus !== 'done';
    const activeTasks = separateDone
        ? visibleTasks.filter((t) => t.status !== 'done')
        : visibleTasks;
    const doneTasks = separateDone
        ? visibleTasks.filter((t) => t.status === 'done')
        : [];
    // 画面に出ているタスク（全選択の対象）
    const shownTasks = showDone ? [...activeTasks, ...doneTasks] : activeTasks;

    const dueViewCounts = Object.fromEntries(
        DUE_VIEWS.map((v) => [
            v.value,
            localTasks.filter((t) => matchesDueView(t, v.value, now)).length,
        ]),
    ) as Record<DueView, number>;

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
        // 先に画面へ反映し、通信を待たずに操作できるようにする
        setLocalTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status } : t)),
        );
        try {
            await api.tasks.update(task.id, { status });
        } catch (e) {
            toast.error(getErrorMessage(e));
            mutateTasks();
            return;
        }
        mutateTasks();

        // 完了にしたタスクは一覧の下へ移るので、取り消せるようにしておく
        if (status === 'done' && task.status !== 'done') {
            toast.success(`「${task.title}」を完了にしました。`, {
                action: {
                    label: '元に戻す',
                    onClick: () => handleStatusChange(task, task.status),
                },
            });
        }
    };

    const handleToggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleLongPress = (id: number) => {
        setReordering(false);
        setSelectModeOn(true);
        setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const exitSelection = () => {
        setSelectModeOn(false);
        setSelectedIds([]);
    };

    const allSelected =
        shownTasks.length > 0 &&
        shownTasks.every((t) => selectedIds.includes(t.id));

    const handleSelectAll = () => {
        setSelectedIds(allSelected ? [] : shownTasks.map((t) => t.id));
    };

    /** 削除して「元に戻す」付きの通知を出す（確認ダイアログの代わり） */
    const deleteWithUndo = async (ids: number[], message: string) => {
        if (ids.length === 0) return;
        setLocalTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
        try {
            if (ids.length === 1) await api.tasks.delete(ids[0]);
            else await api.tasks.bulkDelete(ids);
        } catch (e) {
            toast.error(getErrorMessage(e));
            mutateTasks();
            return;
        }
        mutateTasks();
        toast.success(message, {
            action: {
                label: '元に戻す',
                onClick: async () => {
                    try {
                        await api.tasks.restore(ids);
                        toast.success('削除を取り消しました。');
                    } catch (e) {
                        toast.error(getErrorMessage(e));
                    }
                    mutateTasks();
                },
            },
        });
    };

    const handleDelete = (task: Task) =>
        deleteWithUndo([task.id], `「${task.title}」を削除しました。`);

    const handleBulkDelete = async () => {
        const ids = selectedIds;
        exitSelection();
        await deleteWithUndo(ids, `${ids.length} 件のタスクを削除しました。`);
    };

    const handleBulkDone = async () => {
        const ids = selectedIds;
        exitSelection();
        setLocalTasks((prev) =>
            prev.map((t) =>
                ids.includes(t.id) ? { ...t, status: 'done' } : t,
            ),
        );
        try {
            await api.tasks.bulkUpdateStatus(ids, 'done');
            toast.success(`${ids.length} 件のタスクを完了にしました。`);
        } catch (e) {
            toast.error(getErrorMessage(e));
        }
        mutateTasks();
    };

    /** 未保存の変更があれば確認してから実行する */
    const guardUnsaved = (action: () => void) => {
        if (editor.open && editorDirty) setPendingAction(() => action);
        else action();
    };

    const showEditor = (task: Task | null) => {
        setEditorDirty(false);
        setEditor((prev) => ({ open: true, task, key: prev.key + 1 }));
    };

    const closeEditor = () => {
        setEditorDirty(false);
        setEditor((prev) => ({ ...prev, open: false }));
    };

    const openCreate = () => guardUnsaved(() => showEditor(null));
    const openEdit = (task: Task) => {
        if (editor.open && editor.task?.id === task.id) return;
        guardUnsaved(() => showEditor(task));
    };
    const requestCloseEditor = () => guardUnsaved(closeEditor);

    const editorProps = {
        task: editor.task,
        tags: tags ?? [],
        onSaved: () => {
            closeEditor();
            mutateTasks();
        },
        onDelete: (task: Task) => {
            closeEditor();
            handleDelete(task);
        },
        onDirtyChange: setEditorDirty,
        onRequestClose: requestCloseEditor,
    };

    const isFiltered =
        search !== '' ||
        filterStatus !== ALL ||
        filterTagId !== ALL ||
        filterPriority !== ALL ||
        dueView !== 'all';

    const clearFilters = () => {
        setDueView('all');
        setSearch('');
        setFilterStatus(ALL);
        setFilterTagId(ALL);
        setFilterPriority(ALL);
    };

    // 期限が近い順のときは、期限の区分ごとに見出しを付けて表示する
    const groups =
        sort === 'due_date'
            ? DUE_BUCKETS.map((bucket) => ({
                  ...bucket,
                  tasks: activeTasks.filter(
                      (t) => getDueBucket(t, now) === bucket.key,
                  ),
              })).filter((g) => g.tasks.length > 0)
            : null;

    const renderTask = (task: Task) => (
        <TaskItem
            key={task.id}
            task={task}
            selected={selectedIds.includes(task.id)}
            selecting={selecting}
            reordering={reordering}
            draggable={manualSort}
            onToggleSelect={handleToggleSelect}
            onLongPress={handleLongPress}
            active={editor.open && editor.task?.id === task.id}
            onOpen={openEdit}
            onDelete={handleDelete}
            onDuplicated={() => mutateTasks()}
            onStatusChange={handleStatusChange}
        />
    );

    return (
        <AuthenticatedLayout header="タスク管理">
            <Head title="タスク管理" />

            <div className={cn('pt-8 pb-28', !selecting && 'sm:pb-8')}>
                <div
                    className={cn(
                        'mx-auto px-4 sm:px-6 lg:px-8',
                        panelOpen
                            ? 'grid max-w-7xl grid-cols-[minmax(0,1fr)_26rem] items-start gap-6'
                            : 'max-w-4xl',
                    )}
                >
                    <div className="min-w-0 space-y-4">
                        {/* ツールバー */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                onClick={openCreate}
                                className="hidden sm:flex"
                            >
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
                            {localTasks.length > 0 && (
                                <div className="ml-auto flex gap-2 sm:hidden">
                                    {manualSort && (
                                        <Button
                                            variant={
                                                reordering
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() => {
                                                exitSelection();
                                                setReordering((v) => !v);
                                            }}
                                            aria-pressed={reordering}
                                        >
                                            {reordering ? (
                                                <Check />
                                            ) : (
                                                <ArrowUpDown />
                                            )}
                                            {reordering ? '完了' : '並び替え'}
                                        </Button>
                                    )}
                                    {!reordering && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                selecting
                                                    ? exitSelection()
                                                    : setSelectModeOn(true)
                                            }
                                            aria-pressed={selecting}
                                        >
                                            <ListChecks />
                                            選択
                                        </Button>
                                    )}
                                </div>
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

                            <Select
                                value={sort}
                                onValueChange={(value) => {
                                    setSort(value as SortKey);
                                    setReordering(false);
                                }}
                            >
                                <SelectTrigger
                                    className="w-auto min-w-36 bg-background"
                                    aria-label="並べ替え"
                                >
                                    <ArrowDownWideNarrow />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
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

                        {/* すばやく追加 */}
                        <QuickAddInput
                            tags={tags ?? []}
                            onAdded={(tagCreated) => {
                                mutateTasks();
                                if (tagCreated) mutateTags();
                            }}
                        />

                        {/* 期限による表示の切り替え */}
                        {localTasks.length > 0 && (
                            <div
                                role="tablist"
                                aria-label="期限で表示を切り替え"
                                className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
                            >
                                {DUE_VIEWS.map((v) => (
                                    <Button
                                        key={v.value}
                                        role="tab"
                                        aria-selected={dueView === v.value}
                                        size="sm"
                                        variant={
                                            dueView === v.value
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className={cn(
                                            'shrink-0 rounded-full',
                                            dueView !== v.value &&
                                                'bg-background',
                                        )}
                                        onClick={() => setDueView(v.value)}
                                    >
                                        {v.label}
                                        <span
                                            className={cn(
                                                'tabular-nums',
                                                dueView === v.value
                                                    ? 'opacity-80'
                                                    : 'text-muted-foreground',
                                                v.value === 'overdue' &&
                                                    dueViewCounts.overdue > 0 &&
                                                    dueView !== v.value &&
                                                    'font-medium text-destructive',
                                            )}
                                        >
                                            {dueViewCounts[v.value]}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* 全選択 */}
                        {visibleTasks.length > 0 && (
                            <div className="hidden items-center gap-2 px-3 text-sm text-muted-foreground sm:flex">
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
                                    {visibleTasks.length} 件
                                    {doneTasks.length > 0 &&
                                        `（うち完了 ${doneTasks.length} 件）`}
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
                        ) : visibleTasks.length === 0 ? (
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
                                    items={activeTasks.map((t) => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {groups ? (
                                        <div className="space-y-5">
                                            {groups.map((group) => (
                                                <section
                                                    key={group.key}
                                                    aria-label={group.label}
                                                    className="space-y-2"
                                                >
                                                    <h3
                                                        className={cn(
                                                            'flex items-center gap-2 px-1 text-sm font-medium',
                                                            group.key ===
                                                                'overdue'
                                                                ? 'text-destructive'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {group.label}
                                                        <span className="text-xs font-normal tabular-nums">
                                                            {group.tasks.length}
                                                        </span>
                                                    </h3>
                                                    {group.tasks.map(
                                                        renderTask,
                                                    )}
                                                </section>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {activeTasks.map(renderTask)}
                                        </div>
                                    )}
                                </SortableContext>

                                {activeTasks.length === 0 && (
                                    <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                                        未完了のタスクはありません
                                    </p>
                                )}

                                {/* 完了済み（折りたたみ） */}
                                {doneTasks.length > 0 && (
                                    <section
                                        aria-label="完了済み"
                                        className="mt-5 space-y-2"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowDone((v) => !v)
                                            }
                                            aria-expanded={showDone}
                                            className="flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        >
                                            <ChevronRight
                                                className={cn(
                                                    'size-4 transition-transform',
                                                    showDone && 'rotate-90',
                                                )}
                                            />
                                            完了済み
                                            <span className="text-xs font-normal tabular-nums">
                                                {doneTasks.length}
                                            </span>
                                        </button>
                                        {showDone && (
                                            <SortableContext
                                                items={doneTasks.map(
                                                    (t) => t.id,
                                                )}
                                                strategy={
                                                    verticalListSortingStrategy
                                                }
                                            >
                                                <div className="space-y-2">
                                                    {doneTasks.map(renderTask)}
                                                </div>
                                            </SortableContext>
                                        )}
                                    </section>
                                )}
                                <p className="pt-2 text-center text-xs text-muted-foreground sm:hidden">
                                    {reordering
                                        ? '左端のつまみをドラッグして並び替えます'
                                        : '右にスワイプで完了、左にスワイプで削除、長押しで選択できます'}
                                </p>
                            </DndContext>
                        )}
                    </div>
                    {panelOpen && (
                        <TaskEditorPanel key={editor.key} {...editorProps} />
                    )}
                </div>
            </div>

            {!wide && (
                <TaskEditorDialog
                    key={editor.key}
                    open={editor.open}
                    {...editorProps}
                />
            )}

            <ConfirmDialog
                open={pendingAction !== null}
                onOpenChange={(next) => !next && setPendingAction(null)}
                title="変更を破棄しますか？"
                description="保存していない変更は失われます。"
                confirmLabel="破棄する"
                onConfirm={() => {
                    const action = pendingAction;
                    setPendingAction(null);
                    action?.();
                }}
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

            {/* タスク作成ボタン（スマホ。親指が届く右下に置く） */}
            {!selecting && !reordering && (
                <Button
                    size="icon"
                    onClick={openCreate}
                    className="fixed right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-lg sm:hidden [&_svg:not([class*='size-'])]:size-6"
                    aria-label="タスクを作成"
                >
                    <Plus />
                </Button>
            )}

            {/* 選択中の操作バー */}
            {selecting && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgb(0_0_0/0.05)] backdrop-blur">
                    <div className="mx-auto flex max-w-4xl items-center gap-1 px-2 py-2 sm:gap-2 sm:px-6 lg:px-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={exitSelection}
                            aria-label="選択をやめる"
                        >
                            <X />
                        </Button>
                        <span className="text-sm font-medium tabular-nums">
                            {selectedIds.length} 件選択
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="sm:hidden"
                        >
                            {allSelected ? '選択解除' : 'すべて'}
                        </Button>
                        <div className="ml-auto flex gap-1 sm:gap-2">
                            <Button
                                variant="outline"
                                onClick={handleBulkDone}
                                disabled={selectedIds.length === 0}
                            >
                                <CheckCheck />
                                完了
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                                disabled={selectedIds.length === 0}
                            >
                                <Trash2 />
                                削除
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
