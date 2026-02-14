'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ArrowLeftRight,
    FileText,
    Users,
    Building2,
    Calendar,
    Settings,
    HelpCircle,
    LogOut,
    Search,
    Bell,
    Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen flex bg-background">
            {/* Sidebar */}
            <aside className="w-[260px] bg-card border-r border-border hidden md:flex flex-col py-6 px-4">
                {/* Logo */}
                <div className="flex items-center gap-3.5 px-4 mb-10 group cursor-pointer relative">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
                        <div className="w-11 h-11 bg-gradient-to-tr from-primary to-primary/70 rounded-[14px] flex items-center justify-center shadow-lg shadow-primary/20 relative z-10 border border-white/10">
                            <span className="text-white font-black text-2xl tracking-tighter">U</span>
                        </div>
                    </div>
                    <div className="flex flex-col relative z-10">
                        <span className="text-[13px] font-black text-foreground tracking-[0.25em] uppercase leading-tight">URTHLY</span>
                        <span className="text-[9px] font-bold text-primary/60 uppercase tracking-[0.4em] -mt-0.5">Finance</span>
                    </div>
                </div>

                {/* Menu Section */}
                <div className="flex-1">
                    <p className="px-4 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
                    <nav className="space-y-1">
                        <NavLink href="/" icon={<LayoutDashboard className="w-[18px] h-[18px]" />} active={pathname === '/'}>
                            Dashboard
                        </NavLink>
                        <NavLink href="/transactions" icon={<ArrowLeftRight className="w-[18px] h-[18px]" />} active={pathname === '/transactions'}>
                            Transactions
                        </NavLink>
                        <NavLink href="/invoices" icon={<FileText className="w-[18px] h-[18px]" />} active={pathname.startsWith('/invoices')}>
                            Invoices
                        </NavLink>
                        <NavLink href="/clients" icon={<Users className="w-[18px] h-[18px]" />} active={pathname === '/clients'}>
                            Clients
                        </NavLink>
                        <NavLink href="/suppliers" icon={<Building2 className="w-[18px] h-[18px]" />} active={pathname === '/suppliers'}>
                            Suppliers
                        </NavLink>
                        <NavLink href="/renewals" icon={<Calendar className="w-[18px] h-[18px]" />} active={pathname === '/renewals'}>
                            Renewals
                        </NavLink>
                    </nav>

                    <p className="px-4 mt-8 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</p>
                    <nav className="space-y-1">
                        <NavLink href="/settings" icon={<Settings className="w-[18px] h-[18px]" />} active={pathname === '/settings'}>
                            Settings
                        </NavLink>
                        <NavLink href="#" icon={<HelpCircle className="w-[18px] h-[18px]" />} active={false}>
                            Help
                        </NavLink>
                    </nav>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-8">
                    {/* Search */}
                    <div className="relative w-[320px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center hover:bg-muted transition-colors relative">
                            <Mail className="w-[18px] h-[18px] text-muted-foreground" />
                        </button>
                        <button className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center hover:bg-muted transition-colors relative">
                            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-card" />
                        </button>
                        <div className="h-8 w-px bg-border" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">U</span>
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-sm font-semibold text-foreground leading-tight">User</p>
                                <p className="text-xs text-muted-foreground">user@mail.com</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}

function NavLink({
    href,
    icon,
    children,
    active,
}: {
    href: string
    icon: React.ReactNode
    children: React.ReactNode
    active: boolean
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
        >
            {icon}
            {children}
        </Link>
    )
}
