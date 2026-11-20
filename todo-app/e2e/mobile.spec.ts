import { expect, test } from '@playwright/test';
import { openTasks, quickAdd, taskCard, touch, uniqueTitle } from './helpers';

test.beforeEach(async ({ page }) => {
    await openTasks(page);
});

test('スマホでは右スワイプで完了、左スワイプで削除できる', async ({ page }) => {
    const { swipe } = await touch(page);
    const doneTitle = uniqueTitle('右スワイプ');
    const deleteTitle = uniqueTitle('左スワイプ');
    await quickAdd(page, doneTitle, doneTitle);
    await quickAdd(page, deleteTitle, deleteTitle);

    await swipe(taskCard(page, doneTitle).getByText(doneTitle), 220);
    await expect(
        page.getByText(`「${doneTitle}」を完了にしました。`),
    ).toBeVisible();
    await expect(taskCard(page, doneTitle)).toBeHidden();

    await swipe(taskCard(page, deleteTitle).getByText(deleteTitle), -220);
    await expect(
        page.getByText(`「${deleteTitle}」を削除しました。`),
    ).toBeVisible();
    await expect(taskCard(page, deleteTitle)).toBeHidden();
});

test('スマホでは長押しで選択モードに入り、まとめて完了できる', async ({
    page,
}) => {
    const { longPress } = await touch(page);
    const first = uniqueTitle('まとめて完了 1');
    const second = uniqueTitle('まとめて完了 2');
    await quickAdd(page, first, first);
    await quickAdd(page, second, second);

    await longPress(taskCard(page, first).getByText(first));
    await expect(page.getByText('1 件選択')).toBeVisible();

    await taskCard(page, second).getByText(second).tap();
    await expect(page.getByText('2 件選択')).toBeVisible();

    await page.getByRole('button', { name: '完了', exact: true }).click();
    await expect(
        page.getByText('2 件のタスクを完了にしました。'),
    ).toBeVisible();
    await expect(taskCard(page, first)).toBeHidden();
    await expect(taskCard(page, second)).toBeHidden();
});
