import { Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    LayoutDashboard,
    ListChecks,
    LogOut,
    Menu,
    UserRound,
} from 'lucide-react';
import { type PropsWithChildren, type ReactNode, useState } from 'react';
import AppLogo from '@/Components/AppLogo';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Separator } from '@/Components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/Components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { routeName: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { routeName: 'task.index', label: 'タスク管理', icon: ListChecks },
] as const;

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const logout = () => router.post(route('logout'));

    return (
        <div className="min-h-screen bg-muted/40">
            <nav className="border-b bg-background">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link href={route('dashboard')}>
                            <AppLogo />
                        </Link>

                        <div className="hidden items-center gap-1 sm:flex">
                            {NAV_ITEMS.map((item) => (
                                <Button
                                    key={item.routeName}
                                    asChild
                                    variant="ghost"
                                    className={cn(
                                        route().current(item.routeName) &&
                                            'bg-muted text-foreground',
                                    )}
                                >
                                    <Link href={route(item.routeName)}>
                                        <item.icon />
                                        {item.label}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* ユーザーメニュー（PC） */}
                    <div className="hidden sm:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost">
                                    {user.name}
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="font-medium">
                                        {user.name}
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={route('profile.edit')}>
                                        <UserRound />
                                        マイページ
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={logout}>
                                    <LogOut />
                                    ログアウト
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* メニュー（スマートフォン） */}
                    <Sheet
                        open={mobileMenuOpen}
                        onOpenChange={setMobileMenuOpen}
                    >
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="sm:hidden"
                            >
                                <Menu />
                                <span className="sr-only">メニューを開く</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <SheetHeader>
                                <SheetTitle>{user.name}</SheetTitle>
                                <SheetDescription className="truncate">
                                    {user.email}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-col gap-1 px-4">
                                {NAV_ITEMS.map((item) => (
                                    <Button
                                        key={item.routeName}
                                        asChild
                                        variant="ghost"
                                        className={cn(
                                            'justify-start',
                                            route().current(item.routeName) &&
                                                'bg-muted',
                                        )}
                                    >
                                        <Link href={route(item.routeName)}>
                                            <item.icon />
                                            {item.label}
                                        </Link>
                                    </Button>
                                ))}
                                <Separator className="my-2" />
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="justify-start"
                                >
                                    <Link href={route('profile.edit')}>
                                        <UserRound />
                                        マイページ
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={logout}
                                >
                                    <LogOut />
                                    ログアウト
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>

            {header && (
                <header className="border-b bg-background">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        <h1 className="text-xl font-semibold">{header}</h1>
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
