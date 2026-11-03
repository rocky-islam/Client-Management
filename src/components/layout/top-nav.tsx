'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Plus,
  Bell,
  User,
  LogOut,
  FolderPlus,
  Users,
  CreditCard,
  Settings,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    businessName?: string | null;
  } | null;
  setMobileOpen: (open: boolean) => void;
}

export function TopNav({ user, setMobileOpen }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok && isMounted) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Generate breadcrumb from path
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left section: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center text-xs font-medium text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Home
          </Link>
          {pathSegments.map((segment, idx) => {
            const path = `/${pathSegments.slice(0, idx + 1).join('/')}`;
            const isLast = idx === pathSegments.length - 1;
            const formatted = segment.replace(/-/g, ' ');
            return (
              <React.Fragment key={path}>
                <span className="mx-2 text-muted-foreground/40">/</span>
                {isLast ? (
                  <span className="capitalize text-foreground font-semibold">{formatted}</span>
                ) : (
                  <Link href={path} className="capitalize hover:text-foreground">
                    {formatted}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Center Search Bar */}
      <div className="flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects, client names, order IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 h-9 bg-muted/50 border-input text-xs rounded-lg focus-visible:ring-primary"
          />
        </form>
      </div>

      {/* Right section: Quick actions, notifications, theme, profile */}
      <div className="flex items-center gap-2">
        {/* Quick Add Project Button */}
        <Link href="/projects/new">
          <Button size="sm" className="hidden sm:flex items-center gap-1.5 h-8 text-xs font-medium shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Project</span>
          </Button>
        </Link>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications Icon with dynamic unread counter badge */}
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </Link>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 pl-2 pr-2.5 h-8 rounded-full">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
              </div>
              <span className="hidden md:inline-block text-xs font-medium text-foreground max-w-[100px] truncate">
                {user?.name || 'Rocky'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Rocky Freelancer'}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email || 'admin@rockybusiness.com'}
                </p>
                {user?.businessName && (
                  <p className="text-[11px] text-primary font-medium pt-1">
                    {user.businessName}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/projects/new" className="flex items-center gap-2 cursor-pointer">
                <FolderPlus className="h-4 w-4" />
                <span>New Project</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/clients" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4" />
                <span>Manage Clients</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/revenue" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                <span>Revenue & Payments</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

