'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ArrowLeftRight,
    FileText,
    Users,
    Building2,
    Landmark,
    Calendar,
    Settings,
    HelpCircle,
    Search,
    Bell,
    Mail,
    Menu,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { href: '/invoices', icon: FileText, label: 'Invoices', prefix: true },
    { href: '/clients', icon: Users, label: 'Clients' },
    { href: '/suppliers', icon: Building2, label: 'Suppliers' },
    { href: '/loans', icon: Landmark, label: 'Loans' },
    { href: '/renewals', icon: Calendar, label: 'Renewals' },
]

const generalLinks = [
    { href: '/settings', icon: Settings, label: 'Settings' },
    { href: '#', icon: HelpCircle, label: 'Help' },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const isActive = (href: string, prefix?: boolean) =>
        prefix ? pathname.startsWith(href) : pathname === href

    const sidebarContent = (
        <>
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
                    {navLinks.map(link => (
                        <NavLink
                            key={link.href}
                            href={link.href}
                            icon={<link.icon className="w-[18px] h-[18px]" />}
                            active={isActive(link.href, link.prefix)}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <p className="px-4 mt-8 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</p>
                <nav className="space-y-1">
                    {generalLinks.map(link => (
                        <NavLink
                            key={link.href}
                            href={link.href}
                            icon={<link.icon className="w-[18px] h-[18px]" />}
                            active={isActive(link.href)}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </>
    )

    return (
        <div className="min-h-screen flex bg-background">
            {/* Desktop Sidebar */}
            <aside className="w-[260px] bg-card border-r border-border hidden md:flex flex-col py-6 px-4">
                {sidebarContent}
            </aside>

            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border z-50 flex flex-col py-6 px-4 transition-transform duration-300 ease-in-out md:hidden",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Close button */}
                <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Close menu"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
                {sidebarContent}
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-4 md:px-8">
                    {/* Left: Hamburger (mobile) + Search */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center hover:bg-muted transition-colors md:hidden"
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <div className="relative w-[200px] sm:w-[320px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center hover:bg-muted transition-colors relative hidden sm:flex">
                            <Mail className="w-[18px] h-[18px] text-muted-foreground" />
                        </button>
                        <button className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center hover:bg-muted transition-colors relative">
                            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-card" />
                        </button>
                        <div className="h-8 w-px bg-border hidden sm:block" />
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
    onClick,
}: {
    href: string
    icon: React.ReactNode
    children: React.ReactNode
    active: boolean
    onClick?: () => void
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
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
