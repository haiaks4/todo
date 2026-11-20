import {
    type CollisionDetection,
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    pointerWithin,
    rectIntersection,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { CalendarClock, ListChecks, Repeat } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/Components/ui/badge';
import {
    formatDateTime,
    isOverdue,
    PRIORITY_BADGE_CLASSES,
    PRIORITY_LABELS,
    RECURRENCE_LABELS,
    STATUS_OPTIONS,
} from '@/lib/task';
import { cn } from '@/lib/utils';
import type { Status, Task } from '@/types';

interface Props {
    tasks: Task[];
    onOpen: (task: Task) => void;
    onStatusChange: (task: Task, status: Status) => void;
    /** 編集画面で開いているタスク */
    activeTaskId: number | null;
    /** すべてのタスクを表示しているとき、プロジェクト名を出す */
    showProject: boolean;
}

/**
 * 指（マウス）がある列に落とす。カードが列の幅いっぱいなので、カード全体の重なりで判定すると
 * 隣の列に入っても元の列のままになってしまう。キーボード操作のときは重なりで判定する。
 */
const collisionDetection: CollisionDetection = (args) => {
    const byPointer = pointerWithin(args);
    return byPointer.length > 0 ? byPointer : rectIntersection(args);
};

/** 列の上の色（ステータスが一目で分かるように） */
const COLUMN_ACCENT: Record<Status, string> = {
    todo: 'bg-muted-foreground/40',
    in_progress: 'bg-sky-500',
    done: 'bg-emerald-500',
};

/**
 * ステータスごとの列にタスクを並べる。カードを別の列へドラッグするとステータスが変わる。
 * スマホでは列を横にスクロールし、カードを少し長押ししてからドラッグする。
 */
export default function KanbanBoard({
    tasks,
    onOpen,
    onStatusChange,
    activeTaskId,
    showProject,
}: Props) {
    const [dragging, setDragging] = useState<Task | null>(null);

    const sensors = useSensors(
        // マウスは少し動かしてから（クリックで編集画面を開けるように）
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        // タッチは少し長押ししてから（横スクロールと区別するため）
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 8 },
        }),
        // キーボードは Space で持ち上げ、矢印で動かし、Space で置く（Enter は編集画面を開く）
        useSensor(KeyboardSensor, {
            keyboardCodes: {
                start: ['Space'],
                cancel: ['Escape'],
                end: ['Space'],
            },
        }),
    );

    const handleDragStart = ({ active }: DragStartEvent) => {
        setDragging(tasks.find((t) => t.id === active.id) ?? null);
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setDragging(null);
        const task = tasks.find((t) => t.id === active.id);
        const status = over?.id as Status | undefined;
        if (task && status && status !== task.status) {
            onStatusChange(task, status);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            // 画面の端に寄せたときの自動スクロールをゆっくりにする（スマホで列を通り越さないように）
            autoScroll={{ acceleration: 2, threshold: { x: 0.15, y: 0.1 } }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDragging(null)}
            accessibility={{
                screenReaderInstructions: {
                    draggable:
                        'Space で持ち上げ、左右の矢印キーで列を移動し、もう一度 Space で置きます。Escape で取り消します。',
                },
            }}
        >
            <div
                className={cn(
                    '-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0',
                    // ドラッグ中は列にぴたっと止まるスクロールを止める（自動スクロールと競合するため）
                    !dragging && 'snap-x snap-mandatory',
                )}
            >
                {STATUS_OPTIONS.map((column) => (
                    <Column
                        key={column.value}
                        status={column.value}
                        label={column.label}
                        tasks={tasks.filter((t) => t.status === column.value)}
                    >
                        {(task) => (
                            <Card
                                key={task.id}
                                task={task}
                                active={task.id === activeTaskId}
                                showProject={showProject}
                                onOpen={onOpen}
                            />
                        )}
                    </Column>
                ))}
            </div>

            {/* ドラッグ中に指やマウスに付いて動くカード */}
            <DragOverlay dropAnimation={null}>
                {dragging && (
                    <CardBody
                        task={dragging}
                        showProject={showProject}
                        className="rotate-2 shadow-lg"
                    />
                )}
            </DragOverlay>
        </DndContext>
    );
}

function Column({
    status,
    label,
    tasks,
    children,
}: {
    status: Status;
    label: string;
    tasks: Task[];
    children: (task: Task) => React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
        <section
            ref={setNodeRef}
            aria-label={`${label}の列`}
            className={cn(
                'flex w-[85%] shrink-0 snap-start flex-col rounded-xl border bg-muted/40 transition-colors sm:w-auto',
                isOver && 'border-primary/40 bg-primary/5',
            )}
        >
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <span
                    className={cn('size-2 rounded-full', COLUMN_ACCENT[status])}
                    aria-hidden
                />
                <h3 className="text-sm font-medium">{label}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {tasks.length}
                </span>
            </div>
            <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                {tasks.map(children)}
                {tasks.length === 0 && (
                    <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-6 text-xs text-muted-foreground">
                        ここにドラッグ
                    </p>
                )}
            </div>
        </section>
    );
}

function Card({
    task,
    active,
    showProject,
    onOpen,
}: {
    task: Task;
    active: boolean;
    showProject: boolean;
    onOpen: (task: Task) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
    });

    return (
        <button
            ref={setNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-roledescription="ドラッグできるカード"
            aria-label={`${task.title}（Enter で編集）`}
            onClick={() => onOpen(task)}
            className={cn(
                'touch-manipulation rounded-lg text-left select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                isDragging && 'opacity-40',
            )}
        >
            <CardBody
                task={task}
                showProject={showProject}
                className={cn(
                    active && 'border-primary ring-2 ring-primary/20',
                )}
            />
        </button>
    );
}

/** カードの見た目（一覧に並ぶカードと、ドラッグ中のカードで共通） */
function CardBody({
    task,
    showProject,
    className,
}: {
    task: Task;
    showProject: boolean;
    className?: string;
}) {
    const overdue = isOverdue(task);
    const done = task.status === 'done';
    const subtaskTotal = task.subtasks?.length ?? 0;
    const subtaskDone = task.subtasks?.filter((s) => s.is_done).length ?? 0;

    return (
        <div
            className={cn(
                'space-y-2 rounded-lg border bg-card p-3 shadow-xs',
                overdue && 'border-destructive/50',
                className,
            )}
        >
            <p
                className={cn(
                    'line-clamp-3 text-sm font-medium [overflow-wrap:anywhere]',
                    done && 'text-muted-foreground line-through',
                )}
            >
                {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {task.priority && (
                    <Badge className={PRIORITY_BADGE_CLASSES[task.priority]}>
                        優先度 {PRIORITY_LABELS[task.priority]}
                    </Badge>
                )}
                {task.tag && <Badge variant="outline">{task.tag.name}</Badge>}
                {showProject && task.project && (
                    <span className="max-w-32 truncate">
                        {task.project.name}
                    </span>
                )}
                {subtaskTotal > 0 && (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                        <ListChecks className="size-3.5" aria-hidden />
                        {subtaskDone}/{subtaskTotal}
                    </span>
                )}
                {task.due_date && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 whitespace-nowrap',
                            overdue && 'font-medium text-destructive',
                        )}
                    >
                        <CalendarClock className="size-3.5" aria-hidden />
                        {formatDateTime(task.due_date)}
                    </span>
                )}
                {task.recurrence && (
                    <span className="inline-flex items-center gap-1">
                        <Repeat className="size-3.5" aria-hidden />
                        {RECURRENCE_LABELS[task.recurrence]}
                    </span>
                )}
            </div>
        </div>
    );
}
