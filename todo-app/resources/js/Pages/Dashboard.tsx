import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';

interface Stats {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
}

/** グラフと凡例で使う色（ライト／ダークどちらでも見分けやすい色） */
const STATUS_CONFIG = [
    { key: 'done', label: '完了', color: '#10b981' },
    { key: 'in_progress', label: '進行中', color: '#0ea5e9' },
    { key: 'todo', label: '未着手', color: '#a3a3a3' },
] as const;

const EMPTY_COLOR = '#e5e5e5';

export default function Dashboard({ stats }: PageProps<{ stats: Stats }>) {
    const completionRate =
        stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

    const chartData = STATUS_CONFIG.map((s) => ({
        name: s.label,
        value: stats[s.key],
        color: s.color,
    })).filter((d) => d.value > 0);

    // タスクが0件の場合はグレーの円を表示
    const displayData =
        chartData.length > 0
            ? chartData
            : [{ name: 'タスクなし', value: 1, color: EMPTY_COLOR }];

    const summaryCards = [
        { label: 'すべてのタスク', value: stats.total },
        ...STATUS_CONFIG.map((s) => ({
            label: s.label,
            value: stats[s.key],
            color: s.color,
        })),
    ];

    return (
        <AuthenticatedLayout header="ダッシュボード">
            <Head title="ダッシュボード" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* サマリーカード */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {summaryCards.map((card) => (
                            <Card key={card.label} size="sm">
                                <CardContent>
                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        {'color' in card && (
                                            <span
                                                className="inline-block size-2 rounded-full"
                                                style={{
                                                    background: card.color,
                                                }}
                                            />
                                        )}
                                        {card.label}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">
                                        {card.value}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* グラフ */}
                    <Card>
                        <CardHeader>
                            <CardTitle>タスクの完了率</CardTitle>
                            <CardDescription>
                                ステータスごとのタスクの割合
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center gap-6 sm:flex-row">
                                {/* ドーナツグラフ */}
                                <div className="relative h-56 w-56 shrink-0">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={displayData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="62%"
                                                outerRadius="80%"
                                                paddingAngle={
                                                    chartData.length > 1 ? 3 : 0
                                                }
                                                dataKey="value"
                                                startAngle={90}
                                                endAngle={-270}
                                                isAnimationActive={false}
                                            >
                                                {displayData.map((entry) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={entry.color}
                                                        strokeWidth={0}
                                                    />
                                                ))}
                                            </Pie>
                                            {chartData.length > 0 && (
                                                <Tooltip
                                                    formatter={(value) => [
                                                        `${value}件`,
                                                    ]}
                                                />
                                            )}
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* 中央の完了率 */}
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold">
                                            {completionRate}%
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            完了
                                        </span>
                                    </div>
                                </div>

                                {/* 凡例 */}
                                <div className="w-full space-y-3">
                                    {STATUS_CONFIG.map((s) => {
                                        const count = stats[s.key];
                                        const pct =
                                            stats.total > 0
                                                ? Math.round(
                                                      (count / stats.total) *
                                                          100,
                                                  )
                                                : 0;
                                        return (
                                            <div key={s.key}>
                                                <div className="mb-1 flex justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="inline-block size-2.5 rounded-full"
                                                            style={{
                                                                background:
                                                                    s.color,
                                                            }}
                                                        />
                                                        {s.label}
                                                    </span>
                                                    <span className="font-medium tabular-nums">
                                                        {count}件（{pct}%）
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: s.color,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* タスクが無いときの案内 */}
                    {stats.total === 0 && (
                        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
                            <p className="text-sm text-muted-foreground">
                                タスクがまだありません
                            </p>
                            <Button asChild>
                                <Link href={route('task.index')}>
                                    <Plus />
                                    タスクを作成する
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
