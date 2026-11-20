import axios from 'axios';

export const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export const api = {
    tasks: {
        list: (params?: Record<string, string>) =>
            axios.get('/api/tasks', { params }).then((r) => r.data),
        create: (data: Record<string, unknown>) =>
            axios.post('/api/tasks', data).then((r) => r.data),
        update: (id: number, data: Record<string, unknown>) =>
            axios.patch(`/api/tasks/${id}`, data).then((r) => r.data),
        delete: (id: number) => axios.delete(`/api/tasks/${id}`),
        duplicate: (id: number) =>
            axios.post(`/api/tasks/${id}/duplicate`).then((r) => r.data),
        bulkDelete: (ids: number[]) =>
            axios.post('/api/tasks/bulk-delete', { ids }),
        restore: (ids: number[]) => axios.post('/api/tasks/restore', { ids }),
        bulkUpdateStatus: (ids: number[], status: string) =>
            axios.post('/api/tasks/bulk-status', { ids, status }),
        reorder: (ids: number[]) => axios.post('/api/tasks/reorder', { ids }),
    },
    subtasks: {
        create: (taskId: number, title: string) =>
            axios
                .post(`/api/tasks/${taskId}/subtasks`, { title })
                .then((r) => r.data),
        update: (id: number, data: { title?: string; is_done?: boolean }) =>
            axios.patch(`/api/subtasks/${id}`, data).then((r) => r.data),
        delete: (id: number) => axios.delete(`/api/subtasks/${id}`),
    },
    tags: {
        list: () => axios.get('/api/tags').then((r) => r.data),
        create: (data: { name: string }) =>
            axios.post('/api/tags', data).then((r) => r.data),
        update: (id: number, data: { name: string }) =>
            axios.patch(`/api/tags/${id}`, data).then((r) => r.data),
        delete: (id: number) => axios.delete(`/api/tags/${id}`),
    },
};

/** Laravel のバリデーションエラー（422）のレスポンス形式 */
export type ValidationErrors = Record<string, string[]>;

/** 422 レスポンスであればフィールドごとのエラーを返す */
export const getValidationErrors = (
    error: unknown,
): ValidationErrors | null => {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
        return (error.response.data?.errors as ValidationErrors) ?? {};
    }
    return null;
};

/** ユーザーに表示するエラーメッセージを取り出す */
export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (typeof message === 'string' && message !== '') return message;
        if (!error.response)
            return 'ネットワークエラーが発生しました。接続を確認してください。';
    }
    return 'エラーが発生しました。しばらく経ってから再度お試しください。';
};
