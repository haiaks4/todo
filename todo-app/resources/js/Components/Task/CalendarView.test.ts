import { describe, expect, it } from 'vitest';
import { monthGrid, toDateKey } from './CalendarView';

describe('monthGrid', () => {
    it('月曜はじまりで、前後の月の日を含めて週の単位で並べる', () => {
        // 2026年11月：1日は日曜、30日は月曜
        const days = monthGrid(new Date(2026, 10, 1)).map(toDateKey);
        expect(days[0]).toBe('2026-10-26');
        expect(days).toContain('2026-11-01');
        expect(days.at(-1)).toBe('2026-12-06');
        expect(days).toHaveLength(42);
    });

    it('月曜から始まって日曜で終わる月は 4 週だけ', () => {
        // 2027年2月：1日は月曜、28日は日曜
        const days = monthGrid(new Date(2027, 1, 1)).map(toDateKey);
        expect(days[0]).toBe('2027-02-01');
        expect(days.at(-1)).toBe('2027-02-28');
        expect(days).toHaveLength(28);
    });
});
