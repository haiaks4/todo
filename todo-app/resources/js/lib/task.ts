import type { Priority, Status, Task } from '@/types';

export const STATUS_OPTIONS: { value: Status; label: string }[] = [
    { value: 'todo', label: '未着手' },
    { value: 'in_progress', label: '進行中' },
    { value: 'done', label: '完了' },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
];

export const STATUS_LABELS: Record<Status, string> = {
    todo: '未着手',
    in_progress: '進行中',
    done: '完了',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
    high: '高',
    medium: '中',
    low: '低',
};

/** ステータスのバッジの色 */
export const STATUS_BADGE_CLASSES: Record<Status, string> = {
    todo: 'bg-muted text-muted-foreground',
    in_progress: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

/** 優先度のバッジの色 */
export const PRIORITY_BADGE_CLASSES: Record<Priority, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

/** 期限を過ぎた未完了タスクかどうか */
export const isOverdue = (task: Task): boolean =>
    task.due_date !== null &&
    task.status !== 'done' &&
    new Date(task.due_date) < new Date();

/** 期限を「11/20 10:30」のような形式で表示する（year: true で年も表示） */
export const formatDateTime = (
    value: string,
    options: { year?: boolean } = {},
): string =>
    new Date(value).toLocaleString('ja-JP', {
        ...(options.year ? { year: 'numeric' } : {}),
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
