export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    remind_enabled: boolean;
}

export type Priority = 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in_progress' | 'done';

export interface Tag {
    id: number;
    name: string;
    user_id: number;
}

export interface Task {
    id: number;
    user_id: number;
    tag_id: number | null;
    tag: Tag | null;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: Priority | null;
    status: Status;
    order: number;
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
