<?php

namespace Tests\Unit;

use App\Support\Recurrence;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class RecurrenceTest extends TestCase
{
    /** 2026-11-20（金）10:00 を「今」とする */
    private function now(): CarbonImmutable
    {
        return CarbonImmutable::parse('2026-11-20 10:00:00');
    }

    public static function cases(): array
    {
        return [
            '毎日'                 => ['2026-11-20 18:00', Recurrence::DAILY, '2026-11-21 18:00'],
            '毎週'                 => ['2026-11-20 18:00', Recurrence::WEEKLY, '2026-11-27 18:00'],
            '毎月'                 => ['2026-11-20 18:00', Recurrence::MONTHLY, '2026-12-20 18:00'],
            '毎年'                 => ['2026-11-20 18:00', Recurrence::YEARLY, '2027-11-20 18:00'],
            '平日：金曜の次は月曜' => ['2026-11-20 18:00', Recurrence::WEEKDAYS, '2026-11-23 18:00'],
            '平日：木曜の次は金曜' => ['2026-11-19 23:00', Recurrence::WEEKDAYS, '2026-11-20 23:00'],
            // 期限を大きく過ぎていたら、今より後になるまで進める
            '毎日：期限切れ'       => ['2026-11-01 09:00', Recurrence::DAILY, '2026-11-21 09:00'],
            '毎週：期限切れ'       => ['2026-10-30 09:00', Recurrence::WEEKLY, '2026-11-27 09:00'],
            // 月末は元の日付を基準にするので、ずれていかない
            '毎月：月末'           => ['2026-10-31 09:00', Recurrence::MONTHLY, '2026-11-30 09:00'],
            '毎月：月末の翌々月'   => ['2026-09-30 09:00', Recurrence::MONTHLY, '2026-11-30 09:00'],
            '毎年：うるう日'       => ['2024-02-29 09:00', Recurrence::YEARLY, '2027-02-28 09:00'],
        ];
    }

    #[DataProvider('cases')]
    public function test_next(string $due, string $rule, string $expected): void
    {
        $next = Recurrence::next(CarbonImmutable::parse($due), $rule, $this->now());

        $this->assertSame($expected, $next->format('Y-m-d H:i'));
    }

    public function test_monthly_keeps_original_day_after_short_month(): void
    {
        // 1/31 → 2/28 → 3/31（2/28 を基準にして 3/28 にならない）
        $jan31 = CarbonImmutable::parse('2027-01-31 09:00');
        $this->assertSame('2027-02-28', Recurrence::next($jan31, Recurrence::MONTHLY, $jan31)->format('Y-m-d'));
        $this->assertSame('2027-03-31', Recurrence::next($jan31, Recurrence::MONTHLY, CarbonImmutable::parse('2027-03-01'))->format('Y-m-d'));
    }
}
