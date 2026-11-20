import { CalendarDays, List, SquareKanban } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export type TaskView = 'list' | 'board' | 'calendar';

export const TASK_VIEWS: {
    value: TaskView;
    label: string;
    icon: typeof List;
}[] = [
    { value: 'list', label: 'リスト', icon: List },
    { value: 'board', label: 'かんばん', icon: SquareKanban },
    { value: 'calendar', label: 'カレンダー', icon: CalendarDays },
];

export const isTaskView = (value: unknown): value is TaskView =>
    TASK_VIEWS.some((v) => v.value === value);

interface Props {
    value: TaskView;
    onChange: (value: TaskView) => void;
    /** 表示できる種類（まだ用意していない表示を隠すため） */
    views?: TaskView[];
}

/** タスクの表示（リスト・かんばん・カレンダー）を切り替える */
export default function ViewSwitcher({
    value,
    onChange,
    views = TASK_VIEWS.map((v) => v.value),
}: Props) {
    return (
        <fieldset
            aria-label="表示の切り替え"
            className="inline-flex shrink-0 rounded-lg border bg-background p-0.5"
        >
            {TASK_VIEWS.filter((v) => views.includes(v.value)).map(
                ({ value: view, label, icon: Icon }) => (
                    <Button
                        key={view}
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-pressed={value === view}
                        aria-label={label}
                        title={label}
                        onClick={() => onChange(view)}
                        className={cn(
                            'h-8 gap-1.5 px-2.5',
                            value === view
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        <Icon />
                        <span className="hidden md:inline">{label}</span>
                    </Button>
                ),
            )}
        </fieldset>
    );
}
