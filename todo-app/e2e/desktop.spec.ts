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

test('かんばんでカードを別の列へドラッグするとステータスが変わる', async ({
    page,
}) => {
    await openTasks(page);
    const title = uniqueTitle('かんばんのタスク');
    await quickAdd(page, title, title);

    await page.getByRole('button', { name: 'かんばん', exact: true }).click();
    const column = (label: string) =>
        page.getByRole('region', { name: `${label}の列` });
    const card = column('未着手').getByRole('button', {
        name: new RegExp(title),
    });
    await expect(card).toBeVisible();

    // マウスで「進行中」の列へドラッグする
    const from = await card.boundingBox();
    const to = await column('進行中').boundingBox();
    if (!from || !to) throw new Error('カードか列が表示されていません');
    await page.mouse.move(from.x + 30, from.y + 15);
    await page.mouse.down();
    await page.mouse.move(from.x + 50, from.y + 25, { steps: 5 });
    await page.mouse.move(to.x + to.width / 2, to.y + 60, { steps: 15 });
    await page.mouse.up();

    await expect(
        column('進行中').getByRole('button', { name: new RegExp(title) }),
    ).toBeVisible();

    // 再読み込みしても進行中のまま（表示もかんばんのまま）
    await page.reload();
    await expect(
        column('進行中').getByRole('button', { name: new RegExp(title) }),
    ).toBeVisible();

    // カードをクリックすると編集画面が開く
    await column('進行中')
        .getByRole('button', { name: new RegExp(title) })
        .click();
    await expect(
        page.getByRole('region', { name: 'タスクを編集' }),
    ).toBeVisible();
});
