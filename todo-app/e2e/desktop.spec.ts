import { expect, test } from '@playwright/test';
import { openTasks, quickAdd, taskCard, uniqueTitle } from './helpers';

test('PC では一覧の横のパネルで編集して保存できる', async ({ page }) => {
    await openTasks(page);
    const title = uniqueTitle('パネルで編集');
    const renamed = `${title}（編集済み）`;
    await quickAdd(page, title, title);

    await taskCard(page, title).getByText(title).click();

    const panel = page.getByRole('region', { name: 'タスクを編集' });
    await expect(panel).toBeVisible();
    await panel.getByLabel('タイトル').fill(renamed);
    await panel.getByRole('button', { name: '保存' }).click();

    await expect(page.getByText('タスクを更新しました。')).toBeVisible();
    await expect(panel).toBeHidden();
    await expect(taskCard(page, renamed)).toBeVisible();
});
