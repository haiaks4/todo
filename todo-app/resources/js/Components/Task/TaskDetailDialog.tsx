import { CalendarClock } from 'lucide-react';
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogDescription,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
} from '@/Components/ResponsiveDialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    formatDateTime,
    isOverdue,
    PRIORITY_BADGE_CLASSES,
    PRIORITY_LABELS,
    STATUS_BADGE_CLASSES,
    STATUS_LABELS,
} from '@/lib/task';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface Props {
    task: Task | null;
    onOpenChange: (open: boolean) => void;
    onEdit: (task: Task) => void;
}

export default function TaskDetailDialog({
    task,
    onOpenChange,
    onEdit,
}: Props) {
    return (
        <ResponsiveDialog open={task !== null} onOpenChange={onOpenChange}>
            {task && (
                <ResponsiveDialogContent className="sm:max-w-lg">
                    <ResponsiveDialogHeader>
                        <ResponsiveDialogTitle className="pr-6 break-words">
                            {task.title}
                        </ResponsiveDialogTitle>
                        <ResponsiveDialogDescription>
                            作成日時：
                            {formatDateTime(task.created_at, { year: true })}
                        </ResponsiveDialogDescription>
                    </ResponsiveDialogHeader>

                    <div className="space-y-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                className={STATUS_BADGE_CLASSES[task.status]}
                            >
                                {STATUS_LABELS[task.status]}
                            </Badge>
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
                        </div>

                        {task.due_date && (
                            <div
                                className={cn(
                                    'flex items-center gap-1.5',
                                    isOverdue(task)
                                        ? 'text-destructive'
                                        : 'text-muted-foreground',
                                )}
                            >
                                <CalendarClock className="size-4" />
                                期限：
                                {formatDateTime(task.due_date, { year: true })}
                                {isOverdue(task) && '（期限切れ）'}
                            </div>
                        )}

                        {task.description ? (
                            <div className="rounded-md bg-muted p-3 break-words whitespace-pre-wrap">
                                {task.description}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">
                                説明はありません。
                            </p>
                        )}
                    </div>

                    <ResponsiveDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            閉じる
                        </Button>
                        <Button onClick={() => onEdit(task)}>編集</Button>
                    </ResponsiveDialogFooter>
                </ResponsiveDialogContent>
            )}
        </ResponsiveDialog>
    );
}
