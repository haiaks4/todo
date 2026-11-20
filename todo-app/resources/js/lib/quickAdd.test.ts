import { describe, expect, it } from 'vitest';
import { parseQuickAdd } from './quickAdd';

// 2026-11-19（木）10:00 を「今」とする
const now = new Date(2026, 10, 19, 10, 0);
const parse = (input: string) => parseQuickAdd(input, now);

describe('parseQuickAdd', () => {
    it('タイトルだけ', () => {
        expect(parse('牛乳を買う')).toEqual({
            title: '牛乳を買う',
            dueDate: null,
            priority: null,
            tagName: null,
            recurrence: null,
        });
    });

    it('日付・時刻・タグ・優先度をまとめて読む', () => {
        expect(parse('資料作成 明日15時 #仕事 !高')).toEqual({
            title: '資料作成',
            dueDate: '2026-11-20T15:00',
            priority: 'high',
            tagName: '仕事',
            recurrence: null,
        });
    });

    it('語の順番は問わず、残りの語をタイトルにする', () => {
        const r = parse('!低 #家事 エアコン の 掃除 土曜');
        expect(r.title).toBe('エアコン の 掃除');
        expect(r.dueDate).toBe('2026-11-21T23:59');
        expect(r.priority).toBe('low');
        expect(r.tagName).toBe('家事');
    });

    it('日付の書き方', () => {
        expect(parse('a 今日').dueDate).toBe('2026-11-19T23:59');
        expect(parse('a 明後日').dueDate).toBe('2026-11-21T23:59');
        expect(parse('a 来週').dueDate).toBe('2026-11-23T23:59');
        expect(parse('a 木曜').dueDate).toBe('2026-11-19T23:59');
        expect(parse('a 水曜日').dueDate).toBe('2026-11-25T23:59');
        expect(parse('a 11/25').dueDate).toBe('2026-11-25T23:59');
        expect(parse('a 2027/1/5').dueDate).toBe('2027-01-05T23:59');
        // 年を省略して過去になる日付は来年
        expect(parse('a 1/5').dueDate).toBe('2027-01-05T23:59');
    });

    it('時刻の書き方', () => {
        expect(parse('a 明日9:05').dueDate).toBe('2026-11-20T09:05');
        expect(parse('a 明日15時30分').dueDate).toBe('2026-11-20T15:30');
        expect(parse('a 明日15時半').dueDate).toBe('2026-11-20T15:30');
        expect(parse('a 明日午後3時').dueDate).toBe('2026-11-20T15:00');
        expect(parse('a 明日 午前9時').dueDate).toBe('2026-11-20T09:00');
    });

    it('時刻だけなら今日、過ぎていれば明日', () => {
        expect(parse('a 18時').dueDate).toBe('2026-11-19T18:00');
        expect(parse('a 8時').dueDate).toBe('2026-11-20T08:00');
    });

    it('全角の記号・数字も読む', () => {
        const r = parse('会議　明日１５：００　＃仕事　！中');
        expect(r.title).toBe('会議');
        expect(r.dueDate).toBe('2026-11-20T15:00');
        expect(r.tagName).toBe('仕事');
        expect(r.priority).toBe('medium');
    });

    it('読めない日付・時刻や 2 回目の指定はタイトルとして扱う', () => {
        expect(parse('a 2/30').title).toBe('a 2/30');
        expect(parse('a 25時').title).toBe('a 25時');
        const r = parse('明日 明後日 の準備');
        expect(r.title).toBe('明後日 の準備');
        expect(r.dueDate).toBe('2026-11-20T23:59');
        expect(parse('!最高 a').title).toBe('!最高 a');
    });

    it('繰り返しを読む', () => {
        // 日付が無ければ今日の 23:59
        expect(parse('ゴミ出し 毎日 8時')).toMatchObject({
            title: 'ゴミ出し',
            recurrence: 'daily',
            dueDate: '2026-11-20T08:00',
        });
        expect(parse('日報 平日').dueDate).toBe('2026-11-19T23:59');
        expect(parse('家賃 毎月 11/25')).toMatchObject({
            recurrence: 'monthly',
            dueDate: '2026-11-25T23:59',
        });
        // 毎週◯曜 は、その曜日を期限にする
        expect(parse('定例 毎週月曜 10時')).toMatchObject({
            title: '定例',
            recurrence: 'weekly',
            dueDate: '2026-11-23T10:00',
        });
        expect(parse('a 毎年').recurrence).toBe('yearly');
    });

    it('平日の繰り返しで今日が土日なら、次の月曜にする', () => {
        const saturday = new Date(2026, 10, 21, 10, 0);
        expect(parseQuickAdd('日報 平日', saturday).dueDate).toBe(
            '2026-11-23T23:59',
        );
    });
});
