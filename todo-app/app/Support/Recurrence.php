<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use DateTimeInterface;

/**
 * 繰り返しタスクの次の期限を求める。
 */
final class Recurrence
{
    public const DAILY = 'daily';

    public const WEEKDAYS = 'weekdays';

    public const WEEKLY = 'weekly';

    public const MONTHLY = 'monthly';

    public const YEARLY = 'yearly';

    public const ALL = [self::DAILY, self::WEEKDAYS, self::WEEKLY, self::MONTHLY, self::YEARLY];

    /** 期限を大きく過ぎていても、ここまで進めれば必ず「今」を超える */
    private const MAX_STEPS = 10000;

    /**
     * 現在の期限から 1 回以上進め、「今」より後になった最初の期限を返す。
     * 時刻はそのまま保つ。毎月・毎年は元の日付を基準にするので、
     * 1/31 → 2/28 → 3/31 のように月末がずれていかない。
     */
    public static function next(DateTimeInterface $due, string $rule, ?DateTimeInterface $now = null): CarbonImmutable
    {
        $base = CarbonImmutable::instance($due);
        $now = CarbonImmutable::instance($now ?? now());

        $current = $base;
        for ($n = 1; $n <= self::MAX_STEPS; $n++) {
            $current = match ($rule) {
                self::DAILY    => $base->addDays($n),
                self::WEEKLY   => $base->addWeeks($n),
                self::MONTHLY  => $base->addMonthsNoOverflow($n),
                self::YEARLY   => $base->addYearsNoOverflow($n),
                self::WEEKDAYS => self::nextWeekday($current),
                default        => throw new \InvalidArgumentException("Unknown recurrence: {$rule}"),
            };

            if ($current->greaterThan($now)) {
                return $current;
            }
        }

        return $current;
    }

    /** 翌日以降で最初の平日（月〜金） */
    private static function nextWeekday(CarbonImmutable $date): CarbonImmutable
    {
        $next = $date->addDay();
        while ($next->isWeekend()) {
            $next = $next->addDay();
        }

        return $next;
    }
}
