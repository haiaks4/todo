import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import type { Subtask } from '@/types';
import SubtaskList from './SubtaskList';

vi.mock('@/lib/api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/api')>();
    return {
        ...actual,
        api: {
            subtasks: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        },
    };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const subtask = (id: number, title: string, is_done = false): Subtask => ({
    id,
    task_id: 1,
    title,
    is_done,
    order: id,
});

const setup = (initial: Subtask[] = []) => {
    const onChanged = vi.fn();
    render(
        <SubtaskList
            taskId={1}
            initialSubtasks={initial}
            onChanged={onChanged}
        />,
    );
    return { onChanged, user: userEvent.setup() };
};

describe('SubtaskList', () => {
    beforeEach(() => {
        vi.mocked(api.subtasks.update).mockResolvedValue({});
        vi.mocked(api.subtasks.delete).mockResolvedValue({} as never);
    });

    it('Enter で項目を追加し、入力欄を空にする', async () => {
        vi.mocked(api.subtasks.create).mockResolvedValue(
            subtask(5, '資料を集める'),
        );
        const { user, onChanged } = setup();

        const input = screen.getByRole('textbox', {
            name: 'チェックリストに項目を追加',
        });
        await user.type(input, '資料を集める{Enter}');

        expect(api.subtasks.create).toHaveBeenCalledWith(1, '資料を集める');
        expect(await screen.findByText('資料を集める')).toBeInTheDocument();
        expect(input).toHaveValue('');
        expect(onChanged).toHaveBeenCalled();
    });

    it('チェックで完了を切り替え、進み具合を表示する', async () => {
        const { user } = setup([subtask(1, 'A'), subtask(2, 'B', true)]);
        expect(screen.getByText('1/2')).toBeInTheDocument();

        await user.click(
            screen.getByRole('checkbox', { name: '「A」を完了にする' }),
        );

        expect(api.subtasks.update).toHaveBeenCalledWith(1, { is_done: true });
        expect(screen.getByText('2/2')).toBeInTheDocument();
    });

    it('名前をクリックして変更できる', async () => {
        const { user } = setup([subtask(1, 'A')]);

        await user.click(
            screen.getByRole('button', { name: '「A」の名前を変更' }),
        );
        const input = screen.getByRole('textbox', { name: '項目の名前' });
        await user.clear(input);
        await user.type(input, 'A 改{Enter}');

        expect(api.subtasks.update).toHaveBeenCalledWith(1, { title: 'A 改' });
        expect(screen.getByText('A 改')).toBeInTheDocument();
    });

    it('削除できる。保存に失敗したら元に戻す', async () => {
        const { user } = setup([subtask(1, 'A'), subtask(2, 'B')]);

        await user.click(screen.getByRole('button', { name: '「A」を削除' }));
        expect(api.subtasks.delete).toHaveBeenCalledWith(1);
        expect(screen.queryByText('A')).not.toBeInTheDocument();

        vi.mocked(api.subtasks.delete).mockRejectedValueOnce(new Error('x'));
        await user.click(screen.getByRole('button', { name: '「B」を削除' }));
        const list = screen.getByRole('list');
        expect(await within(list).findByText('B')).toBeInTheDocument();
    });
});
