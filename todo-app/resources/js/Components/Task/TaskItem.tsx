import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    CalendarClock,
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
    DropdownMenuItem,
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-3 rounded-lg border bg-card px-3 py-3 shadow-xs',
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

            {/* タスク情報（クリックで詳細） */}
            <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onDetail(task)}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={cn(
                            'truncate text-sm font-medium',
                            task.status === 'done' &&
                                'text-muted-foreground line-through',
                        )}
                    >
                        {task.title}
                    </span>
                    {task.priority && (
                        <Badge
                            className={PRIORITY_BADGE_CLASSES[task.priority]}
                        >
                            優先度 {PRIORITY_LABELS[task.priority]}
                        </Badge>
                    )}
                    {task.tag && (
                        <Badge variant="outline">{task.tag.name}</Badge>
                    )}
                </div>
                {task.due_date && (
                    <div
                        className={cn(
                            'mt-1 flex items-center gap-1 text-xs',
                            overdue
                                ? 'font-medium text-destructive'
                                : 'text-muted-foreground',
                        )}
                    >
                        <CalendarClock className="size-3.5" />
                        {formatDateTime(task.due_date)}
                        {overdue && '（期限切れ）'}
                    </div>
                )}
            </button>

            {/* ステータス変更 */}
            <Select
                value={task.status}
                onValueChange={(value) => onStatusChange(task, value as Status)}
            >
                <SelectTrigger
                    size="sm"
                    className="w-24 shrink-0"
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
                    <Button variant="ghost" size="icon-sm" aria-label="操作">
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
