import type { Task } from '@/types';

/** 期限による区分 */
export type DueBucket =
    | 'overdue'
    | 'today'
    | 'tomorrow'
    | 'thisWeek'
    | 'later'
    | 'none'
    | 'past';

/** グループ表示の順番と見出し */
export const DUE_BUCKETS: { key: DueBucket; label: string }[] = [
    { key: 'overdue', label: '期限切れ' },
    { key: 'today', label: '今日' },
    { key: 'tomorrow', label: '明日' },
    { key: 'thisWeek', label: '今週' },
    { key: 'later', label: '来週以降' },
    { key: 'none', label: '期限なし' },
    { key: 'past', label: '過去の期限（完了済み）' },
];

/** 一覧の上のタブで選べる表示 */
export type DueView = 'all' | 'overdue' | 'today' | 'week' | 'none';

export const DUE_VIEWS: { value: DueView; label: string }[] = [
    { value: 'all', label: 'すべて' },
    { value: 'overdue', label: '期限切れ' },
    { value: 'today', label: '今日' },
    { value: 'week', label: '今週' },
    { value: 'none', label: '期限なし' },
];

const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/**
 * タスクがどの区分に入るか。週は月曜はじまりで、「今週」は日曜まで。
 * 期限を過ぎた未完了タスクは「期限切れ」、完了済みなら「過去の期限」にする。
 */
export const getDueBucket = (task: Task, now: Date = new Date()): DueBucket => {
    if (!task.due_date) return 'none';
    const due = new Date(task.due_date);
    const today = startOfDay(now);
    const done = task.status === 'done';

    if (!done && due < now) return 'overdue';
    if (due < today) return 'past';
    if (due < addDays(today, 1)) return 'today';
    if (due < addDays(today, 2)) return 'tomorrow';
    // 次の月曜日の 0 時まで（今日が月曜なら 7 日後）
    const daysToNextMonday = (8 - today.getDay()) % 7 || 7;
    if (due < addDays(today, daysToNextMonday)) return 'thisWeek';
    return 'later';
};

const VIEW_BUCKETS: Record<Exclude<DueView, 'all'>, DueBucket[]> = {
    overdue: ['overdue'],
    today: ['today'],
    week: ['today', 'tomorrow', 'thisWeek'],
    none: ['none'],
};

/** タブで選んだ表示にタスクが含まれるか */
export const matchesDueView = (
    task: Task,
    view: DueView,
    now: Date = new Date(),
): boolean =>
    view === 'all' || VIEW_BUCKETS[view].includes(getDueBucket(task, now));
