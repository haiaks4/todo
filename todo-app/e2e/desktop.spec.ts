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

test('カレンダーで日付からタスクを作り、別の日へドラッグして期限を移せる', async ({
    page,
}) => {
    await openTasks(page);
    const title = uniqueTitle('カレンダーのタスク');
    await page.getByRole('button', { name: 'カレンダー', exact: true }).click();

    // 東京時間の今日と、その隣の日（同じ月の中で選ぶ）
    const [y, m, d] = new Date()
        .toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
        .split('-')
        .map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const other = d < lastDay ? d + 1 : d - 1;
    const day = (n: number) =>
        page.getByRole('button', { name: new RegExp(`^${m}月${n}日、`) });

    // 今日を選んで「この日にタスクを追加」→ 期限が今日の 23:59 で作られる
    await day(d).click();
    await page.getByRole('button', { name: 'この日にタスクを追加' }).click();
    const pad = (n: number) => String(n).padStart(2, '0');
    await expect(page.getByLabel('期限')).toHaveValue(
        `${y}-${pad(m)}-${pad(d)}T23:59`,
    );
    await page.getByLabel('タイトル').fill(title);
    await page.getByRole('button', { name: '保存' }).click();
    await expect(
        page
            .getByRole('region', { name: `${m}月${d}日のタスク` })
            .getByText(title),
    ).toBeVisible();

    // 隣の日へドラッグする
    const chip = page
        .getByRole('button', { name: new RegExp(title) })
        .and(page.locator('[aria-roledescription]'));
    await day(other).scrollIntoViewIfNeeded();
    const from = await chip.boundingBox();
    const to = await day(other).boundingBox();
    if (!from || !to) throw new Error('タスクか日付が表示されていません');
    await page.mouse.move(from.x + 10, from.y + 5);
    await page.mouse.down();
    await page.mouse.move(from.x + 30, from.y + 10, { steps: 5 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
        steps: 15,
    });
    await page.mouse.up();

    await expect(
        page
            .getByRole('region', { name: `${m}月${other}日のタスク` })
            .getByText(title),
    ).toBeVisible();
    await expect(
        page.getByText(`「${title}」の期限を ${m}/${other} に変更しました。`),
    ).toBeVisible();
});
