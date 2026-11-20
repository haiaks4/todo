import {
    type CollisionDetection,
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    MouseSensor,
    pointerWithin,
    rectIntersection,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { isOverdue, PRIORITY_LABELS } from '@/lib/task';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface Props {
    tasks: Task[];
    onOpen: (task: Task) => void;
    /** その日を期限にしてタスクを作る */
    onCreateAt: (date: Date) => void;
    /** タスクを別の日に移す（時刻はそのまま） */
    onMoveDue: (task: Task, date: Date) => void;
    /** 編集画面で開いているタスク */
    activeTaskId: number | null;
}

/** マウスがある日に落とす（見つからなければ重なりで判定する） */
const collisionDetection: CollisionDetection = (args) => {
    const byPointer = pointerWithin(args);
    return byPointer.length > 0 ? byPointer : rectIntersection(args);
};

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];
/** PC の日付のマスに出すタスクの数（それ以上は「ほか n 件」） */
const MAX_CHIPS = 3;

const pad = (n: number) => String(n).padStart(2, '0');
/** 日付を「2026-11-20」の形にする（期限の先頭 10 文字と比べる） */
export const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** その月を表示するための日付（前後の月の日を含み、月曜はじまりで 7 の倍数日） */
export const monthGrid = (month: Date): Date[] => {
    const first = startOfMonth(month);
    // 月曜を 0 とした曜日
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    const daysInMonth = new Date(
        first.getFullYear(),
        first.getMonth() + 1,
        0,
    ).getDate();
    const weeks = Math.ceil((offset + daysInMonth) / 7);
    return Array.from(
        { length: weeks * 7 },
        (_, i) =>
            new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate() + i,
            ),
    );
};

/** タスクの印の色（完了・期限切れ・優先度で変える） */
const chipColor = (task: Task) =>
    task.status === 'done'
        ? 'border-l-muted-foreground/30 text-muted-foreground line-through'
        : isOverdue(task)
          ? 'border-l-destructive text-destructive'
          : task.priority === 'high'
            ? 'border-l-red-400'
            : task.priority === 'medium'
              ? 'border-l-amber-400'
              : task.priority === 'low'
                ? 'border-l-emerald-400'
                : 'border-l-sky-400';

const dotColor = (task: Task) =>
    task.status === 'done'
        ? 'bg-muted-foreground/30'
        : isOverdue(task)
          ? 'bg-destructive'
          : 'bg-sky-500';

const timeOf = (task: Task) => task.due_date?.slice(11, 16) ?? '';

/**
 * 期限の日にタスクを並べる月表示のカレンダー。日付を選ぶと、その日のタスクを下に一覧で出す。
 * PC ではタスクを別の日へドラッグすると期限が移る。
 */
export default function CalendarView({
    tasks,
    onOpen,
    onCreateAt,
    onMoveDue,
    activeTaskId,
}: Props) {
    const desktop = useIsDesktop();
    const today = new Date();
    const [month, setMonth] = useState(() => startOfMonth(today));
    const [selected, setSelected] = useState(() => toDateKey(today));
    const [dragging, setDragging] = useState<Task | null>(null);

    // 期限の日ごとにまとめる（時刻順）
    const byDate = useMemo(() => {
        const map = new Map<string, Task[]>();
        for (const task of tasks) {
            if (!task.due_date) continue;
            const key = task.due_date.slice(0, 10);
            map.set(key, [...(map.get(key) ?? []), task]);
        }
        for (const list of map.values()) {
            list.sort((a, b) =>
                (a.due_date ?? '').localeCompare(b.due_date ?? ''),
            );
        }
        return map;
    }, [tasks]);

    const days = monthGrid(month);
    const todayKey = toDateKey(today);
    const noDueCount = tasks.filter((t) => !t.due_date).length;
    const selectedDate = new Date(`${selected}T00:00:00`);
    const selectedTasks = byDate.get(selected) ?? [];

    const moveMonth = (diff: number) =>
        setMonth((m) => new Date(m.getFullYear(), m.getMonth() + diff, 1));

    const goToday = () => {
        setMonth(startOfMonth(today));
        setSelected(todayKey);
    };

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    );

    const handleDragStart = ({ active }: DragStartEvent) =>
        setDragging(tasks.find((t) => t.id === active.id) ?? null);

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setDragging(null);
        const task = tasks.find((t) => t.id === active.id);
        const key = over?.id as string | undefined;
        if (task && key && key !== task.due_date?.slice(0, 10)) {
            onMoveDue(task, new Date(`${key}T00:00:00`));
            setSelected(key);
        }
    };

    return (
        <div className="space-y-4">
            {/* 月の切り替え */}
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold tabular-nums">
                    {month.getFullYear()}年{month.getMonth() + 1}月
                </h3>
                <div className="ml-auto flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={goToday}>
                        今日
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveMonth(-1)}
                        aria-label="前の月"
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveMonth(1)}
                        aria-label="次の月"
                    >
                        <ChevronRight />
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={desktop ? sensors : []}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setDragging(null)}
            >
                <section
                    className="overflow-hidden rounded-xl border bg-card"
                    aria-label={`${month.getFullYear()}年${month.getMonth() + 1}月のカレンダー`}
                >
                    <div
                        className="grid grid-cols-7 border-b bg-muted/40"
                        aria-hidden
                    >
                        {WEEKDAYS.map((w, i) => (
                            <div
                                key={w}
                                className={cn(
                                    'py-1.5 text-center text-xs font-medium text-muted-foreground',
                                    i === 5 && 'text-sky-600 dark:text-sky-400',
                                    i === 6 && 'text-red-500',
                                )}
                            >
                                {w}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {days.map((day) => {
                            const key = toDateKey(day);
                            return (
                                <DayCell
                                    key={key}
                                    dateKey={key}
                                    day={day}
                                    inMonth={
                                        day.getMonth() === month.getMonth()
                                    }
                                    isToday={key === todayKey}
                                    isSelected={key === selected}
                                    tasks={byDate.get(key) ?? []}
                                    desktop={desktop}
                                    activeTaskId={activeTaskId}
                                    onSelect={() => setSelected(key)}
                                    onOpen={onOpen}
                                />
                            );
                        })}
                    </div>
                </section>

                <DragOverlay dropAnimation={null}>
                    {dragging && (
                        <div
                            className={cn(
                                'w-40 truncate rounded border border-l-4 bg-card px-1.5 py-0.5 text-xs shadow-lg',
                                chipColor(dragging),
                            )}
                        >
                            {dragging.title}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {noDueCount > 0 && (
                <p className="text-xs text-muted-foreground">
                    期限のないタスクが {noDueCount}{' '}
                    件あります（カレンダーには表示されません）。
                </p>
            )}

            {/* 選んだ日のタスク */}
            <section
                aria-label={`${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日のタスク`}
                className="space-y-2"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">
                        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}
                        日（
                        {WEEKDAYS[(selectedDate.getDay() + 6) % 7]}）
                    </h3>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {selectedTasks.length} 件
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => onCreateAt(selectedDate)}
                    >
                        <Plus />
                        この日にタスクを追加
                    </Button>
                </div>
                {selectedTasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                        この日が期限のタスクはありません
                    </p>
                ) : (
                    <ul className="space-y-1.5">
                        {selectedTasks.map((task) => (
                            <li key={task.id}>
                                <button
                                    type="button"
                                    onClick={() => onOpen(task)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-lg border border-l-4 bg-card px-3 py-2.5 text-left shadow-xs hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        chipColor(task),
                                        task.id === activeTaskId &&
                                            'ring-2 ring-primary/20',
                                    )}
                                >
                                    <span className="w-11 shrink-0 text-xs tabular-nums">
                                        {timeOf(task)}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                        {task.title}
                                    </span>
                                    {task.recurrence && (
                                        <Repeat
                                            className="size-3.5 shrink-0 text-muted-foreground"
                                            aria-label="繰り返し"
                                        />
                                    )}
                                    {task.priority && (
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            優先度{' '}
                                            {PRIORITY_LABELS[task.priority]}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function DayCell({
    dateKey,
    day,
    inMonth,
    isToday,
    isSelected,
    tasks,
    desktop,
    activeTaskId,
    onSelect,
    onOpen,
}: {
    dateKey: string;
    day: Date;
    inMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    tasks: Task[];
    desktop: boolean;
    activeTaskId: number | null;
    onSelect: () => void;
    onOpen: (task: Task) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: dateKey });
    const weekday = (day.getDay() + 6) % 7;
    const label = `${day.getMonth() + 1}月${day.getDate()}日、タスク ${tasks.length} 件`;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'relative min-h-14 border-r border-b p-1 last:border-r-0 sm:min-h-24 [&:nth-child(7n)]:border-r-0',
                !inMonth && 'bg-muted/30',
                isSelected && 'bg-primary/5',
                isOver && 'bg-primary/10',
            )}
        >
            {/* 日付（押すとその日を選ぶ。マス全体を押せるように広げる） */}
            <button
                type="button"
                onClick={onSelect}
                aria-label={label}
                aria-pressed={isSelected}
                className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
            />
            <span
                className={cn(
                    'pointer-events-none relative inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                    !inMonth && 'text-muted-foreground/60',
                    inMonth &&
                        weekday === 5 &&
                        'text-sky-600 dark:text-sky-400',
                    inMonth && weekday === 6 && 'text-red-500',
                    isToday &&
                        'bg-primary font-semibold text-primary-foreground',
                )}
            >
                {day.getDate()}
            </span>

            {desktop ? (
                <div className="relative mt-0.5 space-y-0.5">
                    {tasks.slice(0, MAX_CHIPS).map((task) => (
                        <Chip
                            key={task.id}
                            task={task}
                            active={task.id === activeTaskId}
                            onOpen={onOpen}
                        />
                    ))}
                    {tasks.length > MAX_CHIPS && (
                        <p className="pointer-events-none px-1 text-xs text-muted-foreground">
                            ほか {tasks.length - MAX_CHIPS} 件
                        </p>
                    )}
                </div>
            ) : (
                tasks.length > 0 && (
                    // スマホは点で件数を表す（タップするとその日の一覧を下に出す）
                    <div
                        className="pointer-events-none relative mt-1 flex justify-center gap-0.5"
                        aria-hidden
                    >
                        {tasks.slice(0, 3).map((task) => (
                            <span
                                key={task.id}
                                className={cn(
                                    'size-1.5 rounded-full',
                                    dotColor(task),
                                )}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

function Chip({
    task,
    active,
    onOpen,
}: {
    task: Task;
    active: boolean;
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
            aria-roledescription="ドラッグできるタスク"
            title={`${timeOf(task)} ${task.title}`}
            onClick={() => onOpen(task)}
            className={cn(
                'relative block w-full truncate rounded border border-l-4 bg-card px-1.5 py-0.5 text-left text-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                chipColor(task),
                active && 'ring-2 ring-primary/30',
                isDragging && 'opacity-40',
            )}
        >
            {task.title}
        </button>
    );
}
