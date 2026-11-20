// すばやく追加の入力解析のテスト（npm run test:js で実行。Node の組み込みテストを使う）
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseQuickAdd } from './quickAdd.ts';

// 2026-11-19（木）10:00 を「今」とする
const now = new Date(2026, 10, 19, 10, 0);
const parse = (input) => parseQuickAdd(input, now);

describe('parseQuickAdd', () => {
    it('タイトルだけ', () => {
        assert.deepEqual(parse('牛乳を買う'), {
            title: '牛乳を買う',
            dueDate: null,
            priority: null,
            tagName: null,
        });
    });

    it('日付・時刻・タグ・優先度をまとめて読む', () => {
        assert.deepEqual(parse('資料作成 明日15時 #仕事 !高'), {
            title: '資料作成',
            dueDate: '2026-11-20T15:00',
            priority: 'high',
            tagName: '仕事',
        });
    });

    it('語の順番は問わず、残りの語をタイトルにする', () => {
        const r = parse('!低 #家事 エアコン の 掃除 土曜');
        assert.equal(r.title, 'エアコン の 掃除');
        assert.equal(r.dueDate, '2026-11-21T23:59');
        assert.equal(r.priority, 'low');
        assert.equal(r.tagName, '家事');
    });

    it('日付の書き方', () => {
        assert.equal(parse('a 今日').dueDate, '2026-11-19T23:59');
        assert.equal(parse('a 明後日').dueDate, '2026-11-21T23:59');
        assert.equal(parse('a 来週').dueDate, '2026-11-23T23:59');
        assert.equal(parse('a 木曜').dueDate, '2026-11-19T23:59');
        assert.equal(parse('a 水曜日').dueDate, '2026-11-25T23:59');
        assert.equal(parse('a 11/25').dueDate, '2026-11-25T23:59');
        assert.equal(parse('a 2027/1/5').dueDate, '2027-01-05T23:59');
        // 年を省略して過去になる日付は来年
        assert.equal(parse('a 1/5').dueDate, '2027-01-05T23:59');
    });

    it('時刻の書き方', () => {
        assert.equal(parse('a 明日9:05').dueDate, '2026-11-20T09:05');
        assert.equal(parse('a 明日15時30分').dueDate, '2026-11-20T15:30');
        assert.equal(parse('a 明日15時半').dueDate, '2026-11-20T15:30');
        assert.equal(parse('a 明日午後3時').dueDate, '2026-11-20T15:00');
        assert.equal(parse('a 明日 午前9時').dueDate, '2026-11-20T09:00');
    });

    it('時刻だけなら今日、過ぎていれば明日', () => {
        assert.equal(parse('a 18時').dueDate, '2026-11-19T18:00');
        assert.equal(parse('a 8時').dueDate, '2026-11-20T08:00');
    });

    it('全角の記号・数字も読む', () => {
        const r = parse('会議　明日１５：００　＃仕事　！中');
        assert.equal(r.title, '会議');
        assert.equal(r.dueDate, '2026-11-20T15:00');
        assert.equal(r.tagName, '仕事');
        assert.equal(r.priority, 'medium');
    });

    it('読めない日付・時刻や 2 回目の指定はタイトルとして扱う', () => {
        assert.equal(parse('a 2/30').title, 'a 2/30');
        assert.equal(parse('a 25時').title, 'a 25時');
        const r = parse('明日 明後日 の準備');
        assert.equal(r.title, '明後日 の準備');
        assert.equal(r.dueDate, '2026-11-20T23:59');
        assert.equal(parse('!最高 a').title, '!最高 a');
    });
});
