import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import QuickAddInput from './QuickAddInput';

vi.mock('@/lib/api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/api')>();
    return {
        ...actual,
        api: {
            tasks: { create: vi.fn() },
            tags: { create: vi.fn() },
        },
    };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const tags = [{ id: 3, user_id: 1, name: '仕事' }];

describe('QuickAddInput', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 10, 19, 10, 0));
        vi.mocked(api.tasks.create).mockResolvedValue({});
        vi.mocked(api.tags.create).mockResolvedValue({ id: 9, name: '企画' });
    });

    const setup = () => {
        const onAdded = vi.fn();
        render(
            <QuickAddInput tags={tags} projectId={null} onAdded={onAdded} />,
        );
        return {
            onAdded,
            input: screen.getByRole('textbox', { name: 'タスクを追加' }),
        };
    };

    it('読み取った期限・タグ・優先度をプレビューし、Enter で既存のタグを使って追加する', async () => {
        const user = userEvent.setup();
        const { input, onAdded } = setup();

        await user.type(input, '資料作成 明日15時 #仕事 !高');
        expect(screen.getByText('11/20 15:00')).toBeInTheDocument();
        expect(screen.getByText('優先度 高')).toBeInTheDocument();
        expect(screen.queryByText(/新しいタグ/)).not.toBeInTheDocument();

        await user.keyboard('{Enter}');

        expect(api.tags.create).not.toHaveBeenCalled();
        expect(api.tasks.create).toHaveBeenCalledWith({
            title: '資料作成',
            due_date: '2026-11-20T15:00',
            priority: 'high',
            recurrence: null,
            tag_id: 3,
            project_id: null,
            status: 'todo',
        });
        expect(onAdded).toHaveBeenCalledWith(false);
        expect(input).toHaveValue('');
    });

    it('知らないタグは新しく作ってから追加する', async () => {
        const user = userEvent.setup();
        const { input, onAdded } = setup();

        await user.type(input, '企画書 #企画');
        expect(screen.getByText(/新しいタグ/)).toBeInTheDocument();
        await user.keyboard('{Enter}');

        expect(api.tags.create).toHaveBeenCalledWith({ name: '企画' });
        expect(api.tasks.create).toHaveBeenCalledWith(
            expect.objectContaining({ title: '企画書', tag_id: 9 }),
        );
        expect(onAdded).toHaveBeenCalledWith(true);
    });

    it('タイトルが無いときは追加せずにエラーを出す', async () => {
        const user = userEvent.setup();
        const { input } = setup();

        await user.type(input, '#仕事 !低{Enter}');

        expect(api.tasks.create).not.toHaveBeenCalled();
        expect(
            screen.getByText('タイトルを入力してください。'),
        ).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-invalid', 'true');
    });
});
