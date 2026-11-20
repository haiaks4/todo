import type { Task } from '@/types';

/** テスト用のタスク。必要な項目だけ上書きして使う */
export const makeTask = (overrides: Partial<Task> = {}): Task => ({
    id: 1,
    user_id: 1,
    tag_id: null,
    title: 'テストのタスク',
    description: null,
    due_date: null,
    recurrence: null,
    priority: null,
    status: 'todo',
    order: 1,
    created_at: '2026-11-01T00:00:00.000000Z',
    updated_at: '2026-11-01T00:00:00.000000Z',
    tag: null,
    subtasks: [],
    ...overrides,
});
