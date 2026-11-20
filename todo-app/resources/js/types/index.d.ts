export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    remind_enabled: boolean;
}

export type Priority = 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in_progress' | 'done';
export type Recurrence = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly';

export interface Tag {
    id: number;
    name: string;
    user_id: number;
}

/** タスクをまとめるプロジェクト（リスト） */
export interface Project {
    id: number;
    name: string;
    order: number;
    /** 未完了のタスク数 */
    active_tasks_count: number;
}

/** タスクの中のチェック項目 */
export interface Subtask {
    id: number;
    task_id: number;
    title: string;
    is_done: boolean;
    order: number;
}

export interface Task {
    id: number;
    user_id: number;
    tag_id: number | null;
    tag: Tag | null;
    /** null はプロジェクトに入っていない（インボックス） */
    project_id: number | null;
    project: Pick<Project, 'id' | 'name'> | null;
    title: string;
    description: string | null;
    due_date: string | null;
    /** 繰り返し。完了にすると次の期限に進んで未着手に戻る */
    recurrence: Recurrence | null;
    priority: Priority | null;
    status: Status;
    order: number;
    subtasks: Subtask[];
    created_at: string;
    updated_at: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
