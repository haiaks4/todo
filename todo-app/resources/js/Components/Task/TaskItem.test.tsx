import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { makeTask } from '@/test/factories';
import TaskItem from './TaskItem';

const renderItem = (props: Partial<ComponentProps<typeof TaskItem>> = {}) => {
    const task = props.task ?? makeTask({ title: '牛乳を買う' });
    const handlers = {
        onToggleSelect: vi.fn(),
        onLongPress: vi.fn(),
        onOpen: vi.fn(),
        onDelete: vi.fn(),
        onDuplicated: vi.fn(),
        onStatusChange: vi.fn(),
    };
    render(
        <DndContext>
            <SortableContext items={[task.id]}>
                <TaskItem
                    task={task}
                    selected={false}
                    selecting={false}
                    reordering={false}
                    draggable
                    active={false}
                    {...handlers}
                    {...props}
                />
            </SortableContext>
        </DndContext>,
    );
    return { task, ...handlers };
};

describe('TaskItem', () => {
    it('丸ボタンで完了にできる', async () => {
        const user = userEvent.setup();
        const { task, onStatusChange } = renderItem();

        await user.click(
            screen.getByRole('button', { name: '「牛乳を買う」を完了にする' }),
        );
        expect(onStatusChange).toHaveBeenCalledWith(task, 'done');
    });

    it('完了済みのタスクは丸ボタンが押された状態で、押すと未着手に戻す', async () => {
        const user = userEvent.setup();
        const done = makeTask({ title: '牛乳を買う', status: 'done' });
        const { onStatusChange } = renderItem({ task: done });

        const button = screen.getByRole('button', {
            name: '「牛乳を買う」を未完了に戻す',
        });
        expect(button).toHaveAttribute('aria-pressed', 'true');
        await user.click(button);
        expect(onStatusChange).toHaveBeenCalledWith(done, 'todo');
    });

    it('タップで編集画面を開く', async () => {
        const user = userEvent.setup();
        const first = renderItem();
        await user.click(screen.getByText('牛乳を買う'));
        expect(first.onOpen).toHaveBeenCalledWith(first.task);
    });

    it('選択モード中のタップは選択の切り替えになる', async () => {
        const user = userEvent.setup();
        const { task, onOpen, onToggleSelect } = renderItem({
            selecting: true,
        });
        await user.click(screen.getByText('牛乳を買う'));
        expect(onToggleSelect).toHaveBeenCalledWith(task.id);
        expect(onOpen).not.toHaveBeenCalled();
    });

    it('期限を過ぎた未完了のタスクに「期限切れ」を表示する', () => {
        renderItem({
            task: makeTask({ title: 'a', due_date: '2020-01-01T09:00:00' }),
        });
        expect(screen.getByText('期限切れ')).toBeInTheDocument();
    });

    it('チェックリストがあれば進み具合を表示する', () => {
        renderItem({
            task: makeTask({
                title: 'a',
                subtasks: [
                    { id: 1, task_id: 1, title: 'x', is_done: true, order: 1 },
                    { id: 2, task_id: 1, title: 'y', is_done: false, order: 2 },
                ],
            }),
        });
        expect(screen.getByText('1/2')).toBeVisible();
        expect(
            screen.getByText(/チェックリスト 2 件中\s*1 件完了/),
        ).toBeInTheDocument();
    });

    it('手動の並び順以外ではドラッグ用のつまみを出さない', () => {
        renderItem({ draggable: false });
        expect(
            screen.queryByRole('button', { name: 'ドラッグして並び替え' }),
        ).not.toBeInTheDocument();
    });
});
