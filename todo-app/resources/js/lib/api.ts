import axios from 'axios';

export const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export const api = {
    tasks: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return axios.get(`/api/tasks${query}`).then((r) => r.data);
        },
        create: (data: Record<string, unknown>) =>
            axios.post('/api/tasks', data).then((r) => r.data),
        update: (id: number, data: Record<string, unknown>) =>
            axios.patch(`/api/tasks/${id}`, data).then((r) => r.data),
        delete: (id: number) => axios.delete(`/api/tasks/${id}`),
        duplicate: (id: number) => axios.post(`/api/tasks/${id}/duplicate`).then((r) => r.data),
        bulkDelete: (ids: number[]) => axios.post('/api/tasks/bulk-delete', { ids }),
        reorder: (ids: number[]) => axios.post('/api/tasks/reorder', { ids }),
    },
    tags: {
        list: () => axios.get('/api/tags').then((r) => r.data),
        create: (data: { name: string }) => axios.post('/api/tags', data).then((r) => r.data),
        update: (id: number, data: { name: string }) =>
            axios.patch(`/api/tags/${id}`, data).then((r) => r.data),
        delete: (id: number) => axios.delete(`/api/tags/${id}`),
    },
};
