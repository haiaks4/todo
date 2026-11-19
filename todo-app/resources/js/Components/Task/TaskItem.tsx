import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    CalendarClock,
    Check,
    Copy,
    GripVertical,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmDialog from '@/Components/ConfirmDialog';
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
    STATUS_OPTIONS,
} from '@/lib/task';
import { cn } from '@/lib/utils';
import type { Status, Task } from '@/types';

interface Props {
    task: Task;
    selected: boolean;
    onSelect: (id: number) => void;
    onDetail: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDeleted: () => void;
    onDuplicated: () => void;
    onStatusChange: (task: Task, status: Status) => void;
}

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
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
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

    const handleDelete = async () => {
        try {
            await api.tasks.delete(task.id);
            toast.success('タスクを削除しました。');
            onDeleted();
        } catch (e) {
            toast.error(getErrorMessage(e));
        }
    };

    const overdue = isOverdue(task);
    const done = task.status === 'done';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-2 rounded-lg border bg-card py-2 pr-1 pl-2 shadow-xs sm:gap-3 sm:pr-2 sm:pl-3',
                overdue && 'border-destructive/50',
                isDragging && 'relative z-10 opacity-60 shadow-md',
            )}
        >
            {/* ドラッグハンドル */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab touch-none rounded text-muted-foreground/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
                aria-label="ドラッグして並び替え"
            >
                <GripVertical className="size-4" />
            </button>

            {/* 一括選択 */}
            <Checkbox
                checked={selected}
                onCheckedChange={() => onSelect(task.id)}
                aria-label={`「${task.title}」を選択`}
            />

            {/* 完了の切り替え（タップ 1 回で完了／未着手に戻す） */}
            <button
                type="button"
                onClick={() => onStatusChange(task, done ? 'todo' : 'done')}
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

            {/* タスク情報（クリックで詳細） */}
            <button
                type="button"
                className="min-w-0 flex-1 py-1 text-left"
                onClick={() => onDetail(task)}
            >
                <span
                    className={cn(
                        'line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]',
                        done && 'text-muted-foreground line-through',
                    )}
                >
                    {task.title}
                </span>
                {(task.priority || task.tag || task.due_date) && (
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
                        {task.tag && (
                            <Badge variant="outline">{task.tag.name}</Badge>
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
                        {overdue && (
                            <Badge variant="destructive">期限切れ</Badge>
                        )}
                    </span>
                )}
            </button>

            {/* ステータス変更（PC のみ。スマホでは操作メニューから変更する） */}
            <Select
                value={task.status}
                onValueChange={(value) => onStatusChange(task, value as Status)}
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
                        <DropdownMenuLabel>ステータス</DropdownMenuLabel>
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
                    <DropdownMenuItem onSelect={() => onEdit(task)}>
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
                        onSelect={() => setConfirmingDelete(true)}
                    >
                        <Trash2 />
                        削除
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                open={confirmingDelete}
                onOpenChange={setConfirmingDelete}
                title="タスクを削除しますか？"
                description={`「${task.title}」を削除します。`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
