import { describe, expect, it } from 'vitest';
import { makeTask } from '@/test/factories';
import { getDueBucket, matchesDueView } from './due';

// 2026-11-19（木）10:00 を「今」とする。今週は 11/22（日）まで
const now = new Date(2026, 10, 19, 10, 0);
const due = (due_date: string | null, status: 'todo' | 'done' = 'todo') =>
    makeTask({ due_date, status });

describe('getDueBucket', () => {
    it.each([
        [null, 'none'],
        ['2026-11-19T09:00:00', 'overdue'], // 今日だが時刻を過ぎている
        ['2026-11-18T18:00:00', 'overdue'],
        ['2026-11-19T23:59:00', 'today'],
        ['2026-11-20T09:00:00', 'tomorrow'],
        ['2026-11-21T09:00:00', 'thisWeek'],
        ['2026-11-22T23:59:00', 'thisWeek'],
        ['2026-11-23T00:00:00', 'later'],
    ] as const)('%s → %s', (date, bucket) => {
        expect(getDueBucket(due(date), now)).toBe(bucket);
    });

    it('期限を過ぎた完了済みのタスクは「過去の期限」、今日のものは「今日」', () => {
        expect(getDueBucket(due('2026-11-18T18:00:00', 'done'), now)).toBe(
            'past',
        );
        expect(getDueBucket(due('2026-11-19T09:00:00', 'done'), now)).toBe(
            'today',
        );
    });

    it('日曜日の「今週」は今日・明日だけ（明日は来週の月曜）', () => {
        const sunday = new Date(2026, 10, 22, 10, 0);
        expect(getDueBucket(due('2026-11-23T09:00:00'), sunday)).toBe(
            'tomorrow',
        );
        expect(getDueBucket(due('2026-11-24T09:00:00'), sunday)).toBe('later');
    });
});

describe('matchesDueView', () => {
    it('「今週」には今日・明日・今週が含まれ、期限切れは含まれない', () => {
        expect(matchesDueView(due('2026-11-19T23:00:00'), 'week', now)).toBe(
            true,
        );
        expect(matchesDueView(due('2026-11-22T09:00:00'), 'week', now)).toBe(
            true,
        );
        expect(matchesDueView(due('2026-11-18T09:00:00'), 'week', now)).toBe(
            false,
        );
        expect(matchesDueView(due(null), 'all', now)).toBe(true);
    });
});
