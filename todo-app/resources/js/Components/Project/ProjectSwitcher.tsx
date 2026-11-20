import { ChevronDown, Folder, Inbox, Layers, Settings2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import type { Project } from '@/types';

/** すべてのタスク */
export const ALL_PROJECTS = 'all';
/** プロジェクトに入っていないタスク */
export const INBOX = 'none';

interface Props {
    /** 'all'・'none'、またはプロジェクトの ID */
    value: string;
    onChange: (value: string) => void;
    projects: Project[];
    onManage: () => void;
}

export const projectLabel = (value: string, projects: Project[]) =>
    value === ALL_PROJECTS
        ? 'すべてのタスク'
        : value === INBOX
          ? 'インボックス'
          : (projects.find((p) => p.id.toString() === value)?.name ??
            'すべてのタスク');

/** 表示するプロジェクトを切り替える。プロジェクトの管理もここから開く */
export default function ProjectSwitcher({
    value,
    onChange,
    projects,
    onManage,
}: Props) {
    const Icon =
        value === ALL_PROJECTS ? Layers : value === INBOX ? Inbox : Folder;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="-ml-2 h-10 max-w-full gap-2 px-2 text-lg font-semibold"
                    aria-label={`プロジェクトを切り替え（今：${projectLabel(value, projects)}）`}
                >
                    <Icon className="size-5 text-muted-foreground" />
                    <span className="truncate">
                        {projectLabel(value, projects)}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                    <DropdownMenuRadioItem value={ALL_PROJECTS}>
                        <Layers />
                        すべてのタスク
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={INBOX}>
                        <Inbox />
                        インボックス
                    </DropdownMenuRadioItem>
                    {projects.length > 0 && <DropdownMenuSeparator />}
                    {projects.map((project) => (
                        <DropdownMenuRadioItem
                            key={project.id}
                            value={project.id.toString()}
                        >
                            <Folder />
                            <span className="min-w-0 flex-1 truncate">
                                {project.name}
                            </span>
                            {project.active_tasks_count > 0 && (
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {project.active_tasks_count}
                                </span>
                            )}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onManage}>
                    <Settings2 />
                    プロジェクトの管理
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
