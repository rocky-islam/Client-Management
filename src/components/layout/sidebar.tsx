'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  FolderKanban,
  FolderPlus,
  CalendarDays,
  ArrowRightLeft,
  CheckSquare,
  Archive,
  Users,
  CreditCard,
  Receipt,
  Target,
  FileText,
  FileBarChart,
  Bell,
  History,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navSections = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
    ],
  },
  {
    title: 'PROJECT MANAGEMENT',
    items: [
      { name: 'All Projects', href: '/projects', icon: FolderKanban },
      { name: 'Add Project', href: '/projects/new', icon: FolderPlus },
      { name: 'Monthly Projects', href: '/monthly', icon: CalendarDays },
      { name: 'Carry Forward', href: '/carry-forward', icon: ArrowRightLeft },
      { name: 'Tasks & Activities', href: '/tasks', icon: CheckSquare },
      { name: 'Archived Projects', href: '/projects?archived=true', icon: Archive },
    ],
  },
  {
    title: 'BUSINESS MANAGEMENT',
    items: [
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Revenue & Payments', href: '/revenue', icon: CreditCard },
      { name: 'Expenses', href: '/expenses', icon: Receipt },
      { name: 'Targets', href: '/targets', icon: Target },
      { name: 'Invoices', href: '/invoices', icon: FileText },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { name: 'Reports', href: '/reports', icon: FileBarChart },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Activity History', href: '/activity', icon: History },
      { name: 'Backup & Restore', href: '/backup', icon: Database },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b px-3.5">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm font-bold">
              R
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-sm leading-tight text-foreground">
                  Rocky Business
                </span>
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  Manager <Sparkles className="h-3 w-3 text-primary inline" />
                </span>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="hidden h-7 w-7 text-muted-foreground lg:flex"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <h4 className="px-3 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                  {section.title}
                </h4>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/projects?archived=true'
                      ? pathname === '/projects' && typeof window !== 'undefined' && window.location.search.includes('archived=true')
                      : item.href === '/projects'
                      ? pathname === '/projects' && (typeof window === 'undefined' || !window.location.search.includes('archived=true'))
                      : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/projects');

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground')} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Add Bottom Action */}
        {!collapsed && (
          <div className="p-3 border-t">
            <Link href="/projects/new" className="w-full">
              <Button className="w-full justify-start gap-2 text-xs h-9 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20">
                <FolderPlus className="h-4 w-4" />
                <span>Quick Add Project</span>
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
