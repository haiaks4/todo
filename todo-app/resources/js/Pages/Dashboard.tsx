import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Link } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Stats {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
}

const STATUS_CONFIG = [
    { key: 'done',        label: '完了',   color: '#6366f1' },
    { key: 'in_progress', label: '進行中', color: '#38bdf8' },
    { key: 'todo',        label: '未着手', color: '#e2e8f0' },
] as const;

export default function Dashboard({ stats }: PageProps<{ stats: Stats }>) {
    const completionRate = stats.total > 0
        ? Math.round((stats.done / stats.total) * 100)
        : 0;

    const chartData = STATUS_CONFIG.map((s) => ({
        name:  s.label,
        value: stats[s.key],
        color: s.color,
    })).filter((d) => d.value > 0);

    // タスクが0件の場合はダミーデータでグレーの円を表示
    const displayData = chartData.length > 0
        ? chartData
        : [{ name: 'タスクなし', value: 1, color: '#e2e8f0' }];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    ダッシュボード
                </h2>
            }
        >
            <Head title="ダッシュボード" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* サマリーカード */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                            { label: '総タスク',  value: stats.total,       color: 'text-gray-700 dark:text-gray-200' },
                            { label: '未着手',    value: stats.todo,        color: 'text-gray-500' },
                            { label: '進行中',    value: stats.in_progress, color: 'text-sky-500' },
                            { label: '完了',      value: stats.done,        color: 'text-indigo-500' },
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
                            >
                                <p className="text-xs text-gray-400">{card.label}</p>
                                <p className={`mt-1 text-2xl font-bold ${card.color}`}>
                                    {card.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* グラフカード */}
                    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
                        <h3 className="mb-4 text-base font-semibold text-gray-700 dark:text-gray-200">
                            タスク完了割合
                        </h3>

                        <div className="flex flex-col items-center gap-6 sm:flex-row">
                            {/* ドーナツグラフ */}
                            <div className="relative h-56 w-56 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={displayData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="62%"
                                            outerRadius="80%"
                                            paddingAngle={chartData.length > 1 ? 3 : 0}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {displayData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`${value}件`]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* 中央の完了率テキスト */}
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-indigo-600">
                                        {completionRate}%
                                    </span>
                                    <span className="text-xs text-gray-400">完了</span>
                                </div>
                            </div>

                            {/* 凡例 */}
                            <div className="w-full space-y-3">
                                {STATUS_CONFIG.map((s) => {
                                    const count = stats[s.key];
                                    const pct = stats.total > 0
                                        ? Math.round((count / stats.total) * 100)
                                        : 0;
                                    return (
                                        <div key={s.key}>
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <span
                                                        className="inline-block h-2.5 w-2.5 rounded-full"
                                                        style={{ background: s.color }}
                                                    />
                                                    {s.label}
                                                </span>
                                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                                    {count}件 ({pct}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{ width: `${pct}%`, background: s.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* タスク管理へのリンク */}
                    {stats.total === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
                            <p className="text-sm text-gray-400">タスクがまだありません</p>
                            <Link
                                href={route('task.index')}
                                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                タスクを作成する →
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
