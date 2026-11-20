import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    CalendarClock,
    Check,
    Copy,
    Folder,
    GripVertical,
    ListChecks,
    MoreHorizontal,
    Pencil,
    Repeat,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { api, getErrorMessage } from '@/lib/api';
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
    task: Task;
    selected: boolean;
    /** 選択モード中（タップで選択を切り替える） */
    selecting: boolean;
    /** 並び替えモード中（スマホでドラッグハンドルを表示する） */
    reordering: boolean;
    /** ドラッグで並び替えできるか（手動の並び順のときだけ） */
    draggable: boolean;
    onToggleSelect: (id: number) => void;
    /** 長押しで選択モードに入る */
    onLongPress: (id: number) => void;
    /** 編集画面で開いているタスク */
    active: boolean;
    /** タップで編集画面を開く */
    onOpen: (task: Task) => void;
    onDelete: (task: Task) => void;
    onDuplicated: () => void;
    onStatusChange: (task: Task, status: Status) => void;
    /** プロジェクト名を表示する（すべてのタスクを表示しているとき） */
    showProject?: boolean;
}

/** 長押しと判定するまでの時間（ミリ秒） */
const LONG_PRESS_MS = 500;
/** スワイプ・長押しを始めたとみなす移動量（px） */
const MOVE_TOLERANCE = 10;

export default function TaskItem({
    task,
    selected,
    selecting,
    reordering,
    draggable,
    onToggleSelect,
    onLongPress,
    active,
    onOpen,
    onDelete,
    onDuplicated,
    onStatusChange,
    showProject = false,
}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, disabled: !draggable });

    const done = task.status === 'done';
    const overdue = isOverdue(task);
    const subtaskTotal = task.subtasks?.length ?? 0;
    const subtaskDone = task.subtasks?.filter((s) => s.is_done).length ?? 0;
    const toggleDone = () => onStatusChange(task, done ? 'todo' : 'done');

    // ---- スワイプ（右：完了の切り替え、左：削除）と長押し（選択モード） ----
    const [offset, setOffset] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const gesture = useRef<{
        x: number;
        y: number;
        axis: 'x' | 'y' | null;
        timer: number | null;
    } | null>(null);
    // スワイプ・長押しの直後に発生する click を無視する
    const suppressClick = useRef(false);

    const gesturesEnabled = !selecting && !reordering;

    const threshold = () =>
        Math.min(96, (cardRef.current?.offsetWidth ?? 300) * 0.3);

    const endGesture = () => {
        if (gesture.current?.timer) clearTimeout(gesture.current.timer);
        gesture.current = null;
        setSwiping(false);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // マウスでは PC 向けの操作（チェックボックスなど）を使う
        if (e.pointerType === 'mouse' || !gesturesEnabled || !e.isPrimary)
            return;
        suppressClick.current = false;
        const timer = window.setTimeout(() => {
            if (gesture.current?.axis !== null) return;
            navigator.vibrate?.(15);
            suppressClick.current = true;
            endGesture();
            onLongPress(task.id);
        }, LONG_PRESS_MS);
        gesture.current = { x: e.clientX, y: e.clientY, axis: null, timer };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const g = gesture.current;
        if (!g) return;
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;

        if (g.axis === null) {
            if (Math.abs(dx) > MOVE_TOLERANCE && Math.abs(dx) > Math.abs(dy)) {
                g.axis = 'x';
                if (g.timer) clearTimeout(g.timer);
                e.currentTarget.setPointerCapture(e.pointerId);
                setSwiping(true);
            } else if (Math.abs(dy) > MOVE_TOLERANCE) {
                // 縦方向はスクロールに任せる
                endGesture();
                return;
            }
        }
        if (g.axis === 'x') {
            // しきい値を超えたら動きを鈍くして「離せば実行される」ことを伝える
            const limit = threshold();
            const damped =
                Math.abs(dx) > limit
                    ? Math.sign(dx) * (limit + (Math.abs(dx) - limit) * 0.3)
                    : dx;
            setOffset(damped);
        }
    };

    const handlePointerUp = () => {
        const g = gesture.current;
        if (g?.axis === 'x') {
            suppressClick.current = true;
            const limit = threshold();
            if (offset >= limit) {
                toggleDone();
            } else if (offset <= -limit) {
                // 画面の外へ流してから削除する
                setOffset(-(cardRef.current?.offsetWidth ?? 400));
                endGesture();
                window.setTimeout(() => onDelete(task), 150);
                return;
            }
        }
        setOffset(0);
        endGesture();
    };

    const handleClickCapture = (e: React.MouseEvent) => {
        if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
        }
    };

    const handleContentClick = () => {
        if (selecting) onToggleSelect(task.id);
        else onOpen(task);
    };

    const handleDuplicate = async () => {
        try {
            await api.tasks.duplicate(task.id);
            toast.success('タスクを複製しました。');
            onDuplicated();
        } catch (e) {
            toast.error(getErrorMessage(e));
        }
    };

    const passed = Math.abs(offset) >= threshold();

    return (
        <div
            ref={setNodeRef}
            data-slot="task-item"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={cn(
                'relative overflow-hidden rounded-lg',
                isDragging && 'z-10 opacity-60 shadow-md',
            )}
        >
            {/* スワイプ中に下から見える操作の案内 */}
            {offset !== 0 && (
                <div
                    aria-hidden
                    className={cn(
                        'absolute inset-0 flex items-center px-5 text-sm font-medium text-white transition-colors',
                        offset > 0
                            ? cn(
                                  'justify-start',
                                  passed
                                      ? 'bg-emerald-500'
                                      : 'bg-emerald-500/60',
                              )
                            : cn(
                                  'justify-end',
                                  passed
                                      ? 'bg-destructive'
                                      : 'bg-destructive/60',
                              ),
                    )}
                >
                    {offset > 0 ? (
                        <span className="flex items-center gap-1.5">
                            {done ? (
                                <RotateCcw className="size-5" />
                            ) : (
                                <Check className="size-5" />
                            )}
                            {done ? '未完了に戻す' : '完了'}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5">
                            削除
                            <Trash2 className="size-5" />
                        </span>
                    )}
                </div>
            )}

            {/* biome-ignore lint/a11y/noStaticElementInteractions: スワイプ操作の受け口。同じ操作はボタンとメニューからも行える */}
            <div
                ref={cardRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => {
                    setOffset(0);
                    endGesture();
                }}
                onClickCapture={handleClickCapture}
                onContextMenu={(e) => {
                    // 長押しでブラウザのメニューが開かないようにする
                    if (gesture.current || suppressClick.current)
                        e.preventDefault();
                }}
                style={{
                    transform: offset ? `translateX(${offset}px)` : undefined,
                    transition: swiping ? 'none' : 'transform 150ms ease-out',
                }}
                className={cn(
                    'relative flex touch-pan-y items-center gap-2 rounded-lg border bg-card py-2 pr-1 pl-2 shadow-xs select-none [-webkit-touch-callout:none] sm:gap-3 sm:pr-2 sm:pl-3 sm:select-auto',
                    overdue && 'border-destructive/50',
                    selected && 'border-primary bg-primary/5',
                    active && 'border-primary ring-2 ring-primary/20',
                )}
            >
                {/* ドラッグハンドル（PC は常に、スマホは並び替えモードのときだけ表示） */}
                {draggable && (
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        className={cn(
                            'shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing',
                            reordering ? 'flex size-10' : 'hidden sm:flex',
                        )}
                        aria-label="ドラッグして並び替え"
                    >
                        <GripVertical
                            className={reordering ? 'size-5' : 'size-4'}
                        />
                    </button>
                )}

                {/* 選択（PC は常に、スマホは選択モードのときだけ表示） */}
                <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggleSelect(task.id)}
                    className={cn(
                        selecting ? 'ml-2 flex' : 'hidden sm:flex',
                        'sm:ml-0',
                    )}
                    aria-label={`「${task.title}」を選択`}
                />

                {/* 完了の切り替え（タップ 1 回で完了／未着手に戻す） */}
                <button
                    type="button"
                    onClick={toggleDone}
                    className="group flex size-10 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label={
                        done
                            ? `「${task.title}」を未完了に戻す`
                            : `「${task.title}」を完了にする`
                    }
                    aria-pressed={done}
                >
                    <span
                        className={cn(
                            'flex size-6 items-center justify-center rounded-full border-2 transition-colors',
                            done
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : task.status === 'in_progress'
                                  ? 'border-sky-500 group-hover:bg-sky-500/10'
                                  : 'border-muted-foreground/40 group-hover:border-emerald-500',
                        )}
                    >
                        {done ? (
                            <Check className="size-4" strokeWidth={3} />
                        ) : (
                            task.status === 'in_progress' && (
                                <span className="size-2 rounded-full bg-sky-500" />
                            )
                        )}
                    </span>
                </button>

                {/* タスク情報（タップで編集画面を開く。選択モード中は選択の切り替え） */}
                <button
                    type="button"
                    className="min-w-0 flex-1 py-1 text-left"
                    onClick={handleContentClick}
                >
                    <span
                        className={cn(
                            'line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]',
                            done && 'text-muted-foreground line-through',
                        )}
                    >
                        {task.title}
                    </span>
                    {((showProject && task.project) ||
                        task.priority ||
                        task.tag ||
                        task.due_date ||
                        subtaskTotal > 0) && (
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {task.priority && (
                                <Badge
                                    className={
                                        PRIORITY_BADGE_CLASSES[task.priority]
                                    }
                                >
                                    優先度 {PRIORITY_LABELS[task.priority]}
                                </Badge>
                            )}
                            {showProject && task.project && (
                                <span className="inline-flex max-w-40 items-center gap-1 text-xs text-muted-foreground">
                                    <Folder
                                        className="size-3.5 shrink-0"
                                        aria-hidden
                                    />
                                    <span className="truncate">
                                        {task.project.name}
                                    </span>
                                </span>
                            )}
                            {task.tag && (
                                <Badge variant="outline">{task.tag.name}</Badge>
                            )}
                            {subtaskTotal > 0 && (
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1 text-xs tabular-nums',
                                        subtaskDone === subtaskTotal
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <ListChecks
                                        className="size-3.5"
                                        aria-hidden
                                    />
                                    <span aria-hidden>
                                        {subtaskDone}/{subtaskTotal}
                                    </span>
                                    <span className="sr-only">
                                        チェックリスト {subtaskTotal} 件中{' '}
                                        {subtaskDone} 件完了
                                    </span>
                                </span>
                            )}
                            {task.due_date && (
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1 text-xs whitespace-nowrap',
                                        overdue
                                            ? 'font-medium text-destructive'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <CalendarClock className="size-3.5" />
                                    {formatDateTime(task.due_date)}
                                </span>
                            )}
                            {task.recurrence && (
                                <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
                                    <Repeat className="size-3.5" aria-hidden />
                                    {RECURRENCE_LABELS[task.recurrence]}
                                </span>
                            )}
                            {overdue && (
                                <Badge variant="destructive">期限切れ</Badge>
                            )}
                        </span>
                    )}
                </button>

                {/* ステータス変更（PC のみ。スマホでは操作メニューから変更する） */}
                <Select
                    value={task.status}
                    onValueChange={(value) =>
                        onStatusChange(task, value as Status)
                    }
                >
                    <SelectTrigger
                        size="sm"
                        className="hidden w-24 shrink-0 sm:flex"
                        aria-label="ステータス"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* 操作メニュー（ダイアログを開くため modal={false} にする） */}
                {!selecting && !reordering && (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                aria-label="操作"
                            >
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                            <DropdownMenuGroup className="sm:hidden">
                                <DropdownMenuLabel>
                                    ステータス
                                </DropdownMenuLabel>
                                <DropdownMenuRadioGroup
                                    value={task.status}
                                    onValueChange={(value) =>
                                        onStatusChange(task, value as Status)
                                    }
                                >
                                    {STATUS_OPTIONS.map((opt) => (
                                        <DropdownMenuRadioItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                                <DropdownMenuSeparator />
                            </DropdownMenuGroup>
                            <DropdownMenuItem onSelect={() => onOpen(task)}>
                                <Pencil />
                                編集
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleDuplicate}>
                                <Copy />
                                複製
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => onDelete(task)}
                            >
                                <Trash2 />
                                削除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
