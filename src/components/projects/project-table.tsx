'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Archive,
  Copy,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  AlertTriangle,
  Flame,
  Check,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { calculateTimeLeft, calculateOutstandingAmount } from '@/lib/calculations';
import { PROJECT_STATUSES, DEFAULT_PROFILES } from '@/lib/constants';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';

export interface ProjectTableItem {
  id: string;
  name: string;
  projectDate: string | Date;
  clientId: string;
  client: { id: string; name: string; companyName?: string | null };
  profileName: string;
  orderId: string;
  value: number | string;
  currency: string;
  advancePayment: number | string;
  orderStatus: string;
  deliveryStatementDate?: string | Date | null;
  remark?: string | null;
  deadline: string | Date;
  salesType: string;
  category?: string;
  projectSource?: string;
  progressPercentage?: number;
  priority?: string;
  isArchived?: boolean;
  isDeleted?: boolean;
  payments?: any[];
  monthlyAssignments?: any[];
}

interface ProjectTableProps {
  data: ProjectTableItem[];
  onRefresh?: () => void;
  title?: string;
}

export function ProjectTable({ data, onRefresh, title = 'All Projects' }: ProjectTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'URGENT' | 'OVERDUE' | 'WIP' | 'DELIVERED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [profileFilter, setProfileFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [salesTypeFilter, setSalesTypeFilter] = useState<string>('ALL');
  const [rowSelection, setRowSelection] = useState({});
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Column visibility state (primary 12 columns visible by default)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    projectDate: true,
    clientName: true,
    profileName: true,
    orderId: true,
    value: true,
    orderStatus: true,
    deadline: true,
    timeLeft: true,
    deliveryStatementDate: true,
    remark: true,
    salesType: true,
    actions: true,
    // Optional columns hidden initially
    id: false,
    name: false,
    category: false,
    projectSource: false,
    progressPercentage: false,
    paymentStatus: false,
    receivedAmount: false,
    outstandingAmount: false,
    priority: false,
  });

  // Calculate high-level urgency counts for quick tabs and banner
  const { urgentCount, overdueCount, wipCount, deliveredCount } = useMemo(() => {
    const today = startOfDay(new Date());
    let urgent = 0;
    let overdue = 0;
    let wip = 0;
    let delivered = 0;

    data.forEach((p) => {
      const isDeliveredOrCancelled = p.orderStatus === 'DELIVERED' || p.orderStatus === 'CANCELLED';
      if (p.orderStatus === 'DELIVERED') delivered++;
      if (p.orderStatus === 'WIP' || p.orderStatus === 'IN_REVIEW' || p.orderStatus === 'REVISION') wip++;

      if (!isDeliveredOrCancelled) {
        const target = startOfDay(new Date(p.deadline));
        const diff = differenceInCalendarDays(target, today);
        if (diff < 0) overdue++;
        else if (diff <= 4) urgent++;
      }
    });

    return { urgentCount: urgent, overdueCount: overdue, wipCount: wip, deliveredCount: delivered };
  }, [data]);

  // Fast inline status updater
  const handleStatusChange = async (projectId: string, newStatus: string) => {
    setUpdatingStatusId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      if (newStatus === 'DELIVERED') {
        toast.success('🎉 Project marked as Delivered!');
      } else {
        toast.success(`Project status updated to ${newStatus}`);
      }

      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    const today = startOfDay(new Date());

    return data.filter((item) => {
      const isDeliveredOrCancelled = item.orderStatus === 'DELIVERED' || item.orderStatus === 'CANCELLED';
      const targetDay = startOfDay(new Date(item.deadline));
      const diffDays = differenceInCalendarDays(targetDay, today);

      // Quick filter pill logic
      if (quickFilter === 'URGENT') {
        if (isDeliveredOrCancelled || diffDays < 0 || diffDays > 4) return false;
      } else if (quickFilter === 'OVERDUE') {
        if (isDeliveredOrCancelled || diffDays >= 0) return false;
      } else if (quickFilter === 'WIP') {
        if (item.orderStatus !== 'WIP' && item.orderStatus !== 'IN_REVIEW' && item.orderStatus !== 'REVISION') return false;
      } else if (quickFilter === 'DELIVERED') {
        if (item.orderStatus !== 'DELIVERED') return false;
      }

      // Dropdown filters
      if (statusFilter !== 'ALL' && item.orderStatus !== statusFilter) return false;
      if (profileFilter !== 'ALL' && item.profileName !== profileFilter) return false;
      if (sourceFilter !== 'ALL' && item.projectSource !== sourceFilter) return false;
      if (salesTypeFilter !== 'ALL' && item.salesType !== salesTypeFilter) return false;

      // Global search filter
      if (globalFilter) {
        const query = globalFilter.toLowerCase();
        const matchesClient = item.client?.name?.toLowerCase().includes(query);
        const matchesOrder = item.orderId?.toLowerCase().includes(query);
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesRemark = item.remark?.toLowerCase().includes(query);
        const matchesId = item.id?.toLowerCase().includes(query);
        if (!matchesClient && !matchesOrder && !matchesName && !matchesRemark && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [data, quickFilter, statusFilter, profileFilter, sourceFilter, salesTypeFilter, globalFilter]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate project');
      toast.success('Project duplicated successfully');
      onRefresh ? onRefresh() : router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle archive');
      const json = await res.json();
      toast.success(json.isArchived ? 'Project archived' : 'Project unarchived');
      onRefresh ? onRefresh() : router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to move this project to trash?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      toast.success('Project moved to trash');
      onRefresh ? onRefresh() : router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error('No projects to export');
      return;
    }

    const headers = [
      'Date',
      'Client Name',
      'Profile Name',
      'Order ID',
      'Value',
      'Currency',
      'Order Status',
      'Project Deadline',
      'Time Left',
      'Delivery Statement Date',
      'Remark',
      'Sales Type',
      'Category',
    ];

    const rows = filteredData.map((p) => [
      formatDate(p.projectDate),
      `"${p.client?.name || ''}"`,
      `"${p.profileName || ''}"`,
      `"${p.orderId || ''}"`,
      p.value,
      p.currency,
      p.orderStatus,
      formatDate(p.deadline),
      calculateTimeLeft(p.deadline, p.orderStatus, (p as any).actualDeliveryDate).text,
      formatDate(p.deliveryStatementDate),
      `"${p.remark || ''}"`,
      p.salesType,
      `"${p.category || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rocky-projects-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported projects to CSV');
  };

  // Define columns in the exact required sequence:
  // 1. Date, 2. Client Name, 3. Profile Name, 4. Order ID, 5. Value,
  // 6. Order Status, 7. Project Deadline, 8. Time Left, 9. Delivery Statement Date,
  // 10. Remark, 11. Sales Type, 12. Actions
  const columns = useMemo<ColumnDef<ProjectTableItem>[]>(
    () => [
      {
        id: 'select',
        meta: {
          className: 'w-[44px] min-w-[44px] max-w-[44px] text-center px-2',
        },
        header: ({ table }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      // 1. Date
      {
        id: 'projectDate',
        accessorKey: 'projectDate',
        meta: {
          className: 'w-[115px] min-w-[110px] whitespace-nowrap',
        },
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-xs whitespace-nowrap text-foreground">
            {formatDate(row.getValue('projectDate'))}
          </span>
        ),
      },
      // 2. Client Name
      {
        id: 'clientName',
        accessorFn: (row) => row.client?.name,
        meta: {
          className: 'w-[185px] min-w-[170px]',
        },
        header: 'Client Name',
        cell: ({ row }) => (
          <Link
            href={`/clients/${row.original.clientId}`}
            className="font-medium text-xs text-primary hover:underline flex flex-col group whitespace-nowrap"
          >
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {row.original.client?.name || 'Unknown'}
            </span>
            {row.original.client?.companyName && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[175px]">
                {row.original.client.companyName}
              </span>
            )}
          </Link>
        ),
      },
      // 3. Profile Name
      {
        id: 'profileName',
        accessorKey: 'profileName',
        meta: {
          className: 'w-[125px] min-w-[115px] whitespace-nowrap',
        },
        header: 'Profile Name',
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[11px] font-normal py-0.5 px-2.5 whitespace-nowrap">
            {row.getValue('profileName')}
          </Badge>
        ),
      },
      // 4. Order ID (strictly whitespace-nowrap)
      {
        id: 'orderId',
        accessorKey: 'orderId',
        meta: {
          className: 'w-[145px] min-w-[135px] whitespace-nowrap',
        },
        header: 'Order ID',
        cell: ({ row }) => (
          <Link
            href={`/projects/${row.original.id}`}
            className="font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors whitespace-nowrap px-2 py-0.5 rounded bg-muted/60 border border-border/60 inline-block tracking-tight"
          >
            {row.getValue('orderId')}
          </Link>
        ),
      },
      // 5. Value
      {
        id: 'value',
        accessorKey: 'value',
        meta: {
          className: 'w-[120px] min-w-[110px] whitespace-nowrap text-right',
        },
        header: ({ column }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="-mr-3 h-8 text-xs font-semibold"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Value
              <ArrowUpDown className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <span className="font-bold text-xs whitespace-nowrap text-foreground">
              {formatCurrency(row.original.value, row.original.currency)}
            </span>
          </div>
        ),
      },
      // 6. Order Status (Interactive 1-click status dropdown switcher)
      {
        id: 'orderStatus',
        accessorKey: 'orderStatus',
        meta: {
          className: 'w-[140px] min-w-[130px] whitespace-nowrap text-center',
        },
        header: () => <div className="text-center">Order Status</div>,
        cell: ({ row }) => {
          const status = row.getValue('orderStatus') as string;
          const config = PROJECT_STATUSES.find((s) => s.value === status);
          const prj = row.original;
          const isUpdating = updatingStatusId === prj.id;

          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={isUpdating}
                    className={`group inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-transform hover:scale-105 cursor-pointer shadow-2xs ${
                      config?.color || 'bg-slate-100 text-slate-800'
                    }`}
                    title="Click to quickly change order status"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    <span>{config?.label || status}</span>
                    <ChevronDown className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-44 text-xs">
                  <DropdownMenuLabel className="text-[11px]">Quick Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {PROJECT_STATUSES.map((s) => (
                    <DropdownMenuItem
                      key={s.value}
                      disabled={status === s.value}
                      onClick={() => handleStatusChange(prj.id, s.value)}
                      className="flex items-center justify-between cursor-pointer text-xs"
                    >
                      <span className={status === s.value ? 'font-bold text-primary' : ''}>
                        {s.label}
                      </span>
                      {status === s.value && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
      // 7. Project Deadline (Before Delivery Statement Date)
      {
        id: 'deadline',
        accessorKey: 'deadline',
        meta: {
          className: 'w-[135px] min-w-[125px] whitespace-nowrap text-center',
        },
        header: ({ column }) => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Project Deadline
              <ArrowUpDown className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <span className="text-xs font-medium whitespace-nowrap text-foreground">
              {formatDate(row.getValue('deadline'))}
            </span>
          </div>
        ),
      },
      // 8. Time Left (Prominent urgent badges: 4d, 3d, 2d, 1d, Today, Overdue)
      {
        id: 'timeLeft',
        meta: {
          className: 'w-[145px] min-w-[135px] whitespace-nowrap text-center',
        },
        header: () => <div className="text-center">Time Left</div>,
        cell: ({ row }) => {
          const prj = row.original;
          const isDeliveredOrCancelled = prj.orderStatus === 'DELIVERED' || prj.orderStatus === 'CANCELLED';
          const targetDay = startOfDay(new Date(prj.deadline));
          const today = startOfDay(new Date());
          const diffDays = differenceInCalendarDays(targetDay, today);
          const res = calculateTimeLeft(
            prj.deadline,
            prj.orderStatus,
            (prj as any).actualDeliveryDate
          );

          let customBadge = null;
          if (!isDeliveredOrCancelled) {
            if (diffDays < 0) {
              customBadge = (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs">
                  <Flame className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                  {Math.abs(diffDays)}d overdue
                </span>
              );
            } else if (diffDays === 0) {
              customBadge = (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 shadow-xs animate-pulse">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  Due Today
                </span>
              );
            } else if (diffDays === 1) {
              customBadge = (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 shadow-xs">
                  <Clock className="h-3 w-3 text-amber-600" />
                  1 day left
                </span>
              );
            } else if (diffDays <= 4) {
              customBadge = (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-xs">
                  <Clock className="h-3 w-3 text-amber-600" />
                  {diffDays} days left
                </span>
              );
            }
          }

          return (
            <div className="flex justify-center">
              {customBadge || (
                <span
                  className={`inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap shadow-xs ${res.badgeColor}`}
                >
                  {res.text}
                </span>
              )}
            </div>
          );
        },
      },
      // 9. Delivery Statement Date (After Time Left)
      {
        id: 'deliveryStatementDate',
        accessorKey: 'deliveryStatementDate',
        meta: {
          className: 'w-[145px] min-w-[135px] whitespace-nowrap text-center',
        },
        header: () => <div className="text-center">Delivery Statement Date</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
              {formatDate(row.getValue('deliveryStatementDate'))}
            </span>
          </div>
        ),
      },
      // 10. Remark
      {
        id: 'remark',
        accessorKey: 'remark',
        meta: {
          className: 'min-w-[190px] max-w-[280px]',
        },
        header: 'Remark',
        cell: ({ row }) => {
          const remark = row.getValue('remark') as string;
          return (
            <span
              className="text-xs text-muted-foreground max-w-[260px] truncate block font-normal"
              title={remark || ''}
            >
              {remark || '-'}
            </span>
          );
        },
      },
      // 11. Sales Type
      {
        id: 'salesType',
        accessorKey: 'salesType',
        meta: {
          className: 'w-[105px] min-w-[95px] whitespace-nowrap text-center',
        },
        header: () => <div className="text-center">Sales Type</div>,
        cell: ({ row }) => {
          const type = row.getValue('salesType') as string;
          const isRepeat = type === 'REPEAT_ORDER';
          return (
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold whitespace-nowrap px-2 py-0.5 ${
                  isRepeat
                    ? 'border-indigo-300 text-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/30 dark:text-indigo-300'
                    : 'border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-900/50 dark:text-slate-300'
                }`}
              >
                {isRepeat ? 'Repeat' : 'New'}
              </Badge>
            </div>
          );
        },
      },
      // 12. Actions
      {
        id: 'actions',
        meta: {
          className: 'w-[75px] min-w-[70px] text-right pr-4',
        },
        header: () => <div className="text-right pr-2">Actions</div>,
        cell: ({ row }) => {
          const prj = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 text-xs">
                  <DropdownMenuLabel className="text-xs">Project Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${prj.id}`} className="flex items-center gap-2 cursor-pointer">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span>View Details</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${prj.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                      <Edit className="h-4 w-4 text-amber-500" />
                      <span>Edit Project</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* 1-Click Fast Mark as Delivered */}
                  {prj.orderStatus !== 'DELIVERED' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(prj.id, 'DELIVERED')}
                      className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700 font-medium"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Mark Delivered</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => {
                      const text = `Order ID: ${prj.orderId} | Client: ${prj.client?.name || ''} | Value: ${formatCurrency(prj.value, prj.currency)} | Deadline: ${formatDate(prj.deadline)}`;
                      navigator.clipboard.writeText(text);
                      toast.success('Project details copied to clipboard');
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="h-4 w-4 text-slate-500" />
                    <span>Copy Order Info</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href={`/carry-forward?projectId=${prj.id}`} className="flex items-center gap-2 cursor-pointer">
                      <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
                      <span>Carry Forward</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleDuplicate(prj.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="h-4 w-4 text-emerald-500" />
                    <span>Duplicate</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleArchive(prj.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Archive className="h-4 w-4 text-slate-500" />
                    <span>{prj.isArchived ? 'Unarchive' : 'Archive'}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(prj.id)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
      // Optional columns:
      {
        id: 'id',
        accessorKey: 'id',
        meta: { className: 'w-[140px] whitespace-nowrap font-mono' },
        header: 'Project ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('id')}</span>,
      },
      {
        id: 'name',
        accessorKey: 'name',
        meta: { className: 'w-[180px] min-w-[160px]' },
        header: 'Project Name',
        cell: ({ row }) => <span className="text-xs font-medium">{row.getValue('name')}</span>,
      },
      {
        id: 'category',
        accessorKey: 'category',
        meta: { className: 'w-[130px] whitespace-nowrap' },
        header: 'Category',
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue('category')}</span>,
      },
      {
        id: 'projectSource',
        accessorKey: 'projectSource',
        meta: { className: 'w-[130px] whitespace-nowrap' },
        header: 'Source',
        cell: ({ row }) => <span className="text-xs">{row.getValue('projectSource')}</span>,
      },
      {
        id: 'progressPercentage',
        accessorKey: 'progressPercentage',
        meta: { className: 'w-[95px] text-center' },
        header: 'Progress',
        cell: ({ row }) => {
          const val = Number(row.getValue('progressPercentage') || 0);
          return <span className="text-xs font-semibold">{val}%</span>;
        },
      },
      {
        id: 'paymentStatus',
        meta: { className: 'w-[120px] text-center whitespace-nowrap' },
        header: 'Payment Status',
        cell: ({ row }) => {
          const { paymentStatus } = calculateOutstandingAmount(
            Number(row.original.value),
            Number(row.original.advancePayment),
            row.original.payments || []
          );
          return (
            <Badge variant="outline" className="text-[10px]">
              {paymentStatus}
            </Badge>
          );
        },
      },
    ],
    [updatingStatusId]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Quick Filter Tabs for High-Urgency Deadlines & Active States */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <Button
          variant={quickFilter === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter('ALL')}
          className="h-8 text-xs rounded-full gap-1.5 shadow-2xs"
        >
          <span>All Projects</span>
          <Badge
            variant={quickFilter === 'ALL' ? 'secondary' : 'outline'}
            className="text-[10px] py-0 px-1.5"
          >
            {data.length}
          </Badge>
        </Button>

        <Button
          variant={quickFilter === 'URGENT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter(quickFilter === 'URGENT' ? 'ALL' : 'URGENT')}
          className={`h-8 text-xs rounded-full gap-1.5 shadow-2xs ${
            urgentCount > 0 && quickFilter !== 'URGENT'
              ? 'border-amber-400 text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950/40'
              : ''
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span>Due in ≤ 4 Days</span>
          <Badge
            variant="secondary"
            className="text-[10px] py-0 px-1.5 bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold"
          >
            {urgentCount}
          </Badge>
        </Button>

        <Button
          variant={quickFilter === 'OVERDUE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter(quickFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`h-8 text-xs rounded-full gap-1.5 shadow-2xs ${
            overdueCount > 0 && quickFilter !== 'OVERDUE'
              ? 'border-rose-400 text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 dark:text-rose-300 dark:border-rose-700 dark:bg-rose-950/40'
              : ''
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-rose-500" />
          <span>Overdue</span>
          <Badge
            variant="secondary"
            className="text-[10px] py-0 px-1.5 bg-rose-500/20 text-rose-900 dark:text-rose-200 font-bold"
          >
            {overdueCount}
          </Badge>
        </Button>

        <Button
          variant={quickFilter === 'WIP' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter(quickFilter === 'WIP' ? 'ALL' : 'WIP')}
          className="h-8 text-xs rounded-full gap-1.5 shadow-2xs"
        >
          <span>Active (WIP)</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
            {wipCount}
          </Badge>
        </Button>

        <Button
          variant={quickFilter === 'DELIVERED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter(quickFilter === 'DELIVERED' ? 'ALL' : 'DELIVERED')}
          className="h-8 text-xs rounded-full gap-1.5 shadow-2xs"
        >
          <span>Delivered</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
            {deliveredCount}
          </Badge>
        </Button>
      </div>

      {/* Deadline Color Legend & Alert Notice Bar */}
      {(urgentCount > 0 || overdueCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/70 bg-amber-500/10 dark:border-amber-800/60 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs text-foreground">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">
                Deadline Highlights: {urgentCount} project(s) due within 4 days
                {overdueCount > 0 && ` • ${overdueCount} overdue project(s)`}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-500/40 border border-amber-500 inline-block" />
                  <span><strong>Amber row</strong>: Delivery in 4 days or less</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-500/40 border border-rose-500 inline-block" />
                  <span><strong>Red row</strong>: Overdue deadline</span>
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter(quickFilter === 'URGENT' ? 'ALL' : 'URGENT')}
            className="h-7 text-xs border-amber-400 dark:border-amber-700 font-medium"
          >
            {quickFilter === 'URGENT' ? 'Show All Rows' : 'Show Only Urgent (≤ 4 Days)'}
          </Button>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Global Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search client, order ID, name..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Profile Filter */}
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">All Profiles</option>
            {DEFAULT_PROFILES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Sales Type Filter */}
          <select
            value={salesTypeFilter}
            onChange={(e) => setSalesTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">All Sales Types</option>
            <option value="NEW_ORDER">New Order</option>
            <option value="REPEAT_ORDER">Repeat Order</option>
          </select>
        </div>

        {/* Right Buttons: Columns visibility, CSV export, Add Project */}
        <div className="flex items-center gap-2">
          {/* Column Visibility Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize text-xs"
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) => col.toggleVisibility(!!value)}
                    >
                      {col.id.replace(/([A-Z])/g, ' $1')}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="h-9 text-xs gap-1.5"
            title="Export filtered records to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV Export</span>
          </Button>

          <Link href="/projects/new">
            <Button size="sm" className="h-9 text-xs gap-1.5 shadow-sm">
              <span>+ Add Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* TanStack Table Container with clean horizontal scrolling and strict minimum width */}
      <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table className="w-full min-w-[1380px] text-xs">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'h-11 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap',
                      (header.column.columnDef as any).meta?.className
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const prj = row.original;
                const isDeliveredOrCancelled = prj.orderStatus === 'DELIVERED' || prj.orderStatus === 'CANCELLED';
                const targetDay = startOfDay(new Date(prj.deadline));
                const today = startOfDay(new Date());
                const diffDays = differenceInCalendarDays(targetDay, today);

                // Row highlighting based on urgency:
                // 1. Red tint for Overdue (< 0 days)
                // 2. Amber tint for Urgent (<= 4 days left)
                let rowBgClass = '';
                let rowBorderClass = '';

                if (!isDeliveredOrCancelled) {
                  if (diffDays < 0) {
                    rowBgClass = 'bg-rose-500/15 hover:bg-rose-500/25 dark:bg-rose-950/40 dark:hover:bg-rose-950/55 font-medium';
                    rowBorderClass = 'border-l-4 border-l-rose-500';
                  } else if (diffDays <= 4) {
                    rowBgClass = 'bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-950/40 dark:hover:bg-amber-950/55 font-medium';
                    rowBorderClass = 'border-l-4 border-l-amber-500';
                  }
                }

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'transition-colors',
                      rowBgClass || 'hover:bg-muted/40'
                    )}
                  >
                    {row.getVisibleCells().map((cell, cellIdx) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'px-3 py-3 align-middle',
                          (cell.column.columnDef as any).meta?.className,
                          cellIdx === 0 && rowBorderClass
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-36 text-center text-muted-foreground text-xs">
                  No projects found matching the filter criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div>
          Showing {table.getFilteredRowModel().rows.length} of {data.length} total projects
          {Object.keys(rowSelection).length > 0 && ` (${Object.keys(rowSelection).length} selected)`}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-2.5 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>
          <span className="font-medium text-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-2.5 text-xs"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
