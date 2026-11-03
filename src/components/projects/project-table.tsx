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
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTimeLeft, calculateOutstandingAmount } from '@/lib/calculations';
import { PROJECT_STATUSES, SALES_TYPES, DEFAULT_PROFILES, DEFAULT_SOURCES } from '@/lib/constants';
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
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [profileFilter, setProfileFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [salesTypeFilter, setSalesTypeFilter] = useState<string>('ALL');
  const [rowSelection, setRowSelection] = useState({});

  // Column visibility state (primary columns visible by default)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    projectDate: true,
    clientName: true,
    profileName: true,
    orderId: true,
    value: true,
    orderStatus: true,
    deliveryStatementDate: true,
    remark: true,
    deadline: true,
    timeLeft: true,
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

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (statusFilter !== 'ALL' && item.orderStatus !== statusFilter) return false;
      if (profileFilter !== 'ALL' && item.profileName !== profileFilter) return false;
      if (sourceFilter !== 'ALL' && item.projectSource !== sourceFilter) return false;
      if (salesTypeFilter !== 'ALL' && item.salesType !== salesTypeFilter) return false;
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
  }, [data, statusFilter, profileFilter, sourceFilter, salesTypeFilter, globalFilter]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate project');
      toast.success('Project duplicated successfully');
      onRefresh?.();
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
      onRefresh?.();
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
      onRefresh?.();
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
      'Delivery Statement Date',
      'Remark',
      'Project Deadline',
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
      formatDate(p.deliveryStatementDate),
      `"${p.remark || ''}"`,
      formatDate(p.deadline),
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

  // Define columns in the EXACT required order
  const columns = useMemo<ColumnDef<ProjectTableItem>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      // 1. Date
      {
        id: 'projectDate',
        accessorKey: 'projectDate',
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
          <span className="font-medium text-xs whitespace-nowrap">
            {formatDate(row.getValue('projectDate'))}
          </span>
        ),
      },
      // 2. Client Name
      {
        id: 'clientName',
        accessorFn: (row) => row.client?.name,
        header: 'Client Name',
        cell: ({ row }) => (
          <Link
            href={`/clients/${row.original.clientId}`}
            className="font-medium text-xs text-primary hover:underline flex flex-col"
          >
            <span>{row.original.client?.name || 'Unknown'}</span>
            {row.original.client?.companyName && (
              <span className="text-[10px] text-muted-foreground">{row.original.client.companyName}</span>
            )}
          </Link>
        ),
      },
      // 3. Profile Name
      {
        id: 'profileName',
        accessorKey: 'profileName',
        header: 'Profile Name',
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[11px] font-normal py-0">
            {row.getValue('profileName')}
          </Badge>
        ),
      },
      // 4. Order ID
      {
        id: 'orderId',
        accessorKey: 'orderId',
        header: 'Order ID',
        cell: ({ row }) => (
          <Link
            href={`/projects/${row.original.id}`}
            className="font-mono text-xs font-semibold hover:text-primary transition-colors"
          >
            {row.getValue('orderId')}
          </Link>
        ),
      },
      // 5. Value
      {
        id: 'value',
        accessorKey: 'value',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Value
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-xs whitespace-nowrap">
            {formatCurrency(row.original.value, row.original.currency)}
          </span>
        ),
      },
      // 6. Order Status
      {
        id: 'orderStatus',
        accessorKey: 'orderStatus',
        header: 'Order Status',
        cell: ({ row }) => {
          const status = row.getValue('orderStatus') as string;
          const config = PROJECT_STATUSES.find((s) => s.value === status);
          return (
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                config?.color || 'bg-slate-100 text-slate-800'
              }`}
            >
              {config?.label || status}
            </span>
          );
        },
      },
      // 7. Delivery Statement Date
      {
        id: 'deliveryStatementDate',
        accessorKey: 'deliveryStatementDate',
        header: 'Delivery Statement Date',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(row.getValue('deliveryStatementDate'))}
          </span>
        ),
      },
      // 8. Remark
      {
        id: 'remark',
        accessorKey: 'remark',
        header: 'Remark',
        cell: ({ row }) => {
          const remark = row.getValue('remark') as string;
          return (
            <span
              className="text-xs text-muted-foreground max-w-[180px] truncate block"
              title={remark || ''}
            >
              {remark || '-'}
            </span>
          );
        },
      },
      // 9. Project Deadline
      {
        id: 'deadline',
        accessorKey: 'deadline',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Project Deadline
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap">
            {formatDate(row.getValue('deadline'))}
          </span>
        ),
      },
      // 10. Time Left (Dynamically calculated, never stored)
      {
        id: 'timeLeft',
        header: 'Time Left',
        cell: ({ row }) => {
          const res = calculateTimeLeft(
            row.original.deadline,
            row.original.orderStatus,
            (row.original as any).actualDeliveryDate
          );
          return (
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${res.badgeColor}`}
            >
              {res.text}
            </span>
          );
        },
      },
      // 11. Sales Type
      {
        id: 'salesType',
        accessorKey: 'salesType',
        header: 'Sales Type',
        cell: ({ row }) => {
          const type = row.getValue('salesType') as string;
          const isRepeat = type === 'REPEAT_ORDER';
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-medium ${
                isRepeat
                  ? 'border-indigo-300 text-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20 dark:text-indigo-300'
                  : 'border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-900/40 dark:text-slate-300'
              }`}
            >
              {isRepeat ? 'Repeat' : 'New'}
            </Badge>
          );
        },
      },
      // 12. Actions
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
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
                <DropdownMenuContent align="end" className="w-48">
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
        header: 'Project ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('id')}</span>,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Project Name',
        cell: ({ row }) => <span className="text-xs font-medium">{row.getValue('name')}</span>,
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue('category')}</span>,
      },
      {
        id: 'projectSource',
        accessorKey: 'projectSource',
        header: 'Source',
        cell: ({ row }) => <span className="text-xs">{row.getValue('projectSource')}</span>,
      },
      {
        id: 'progressPercentage',
        accessorKey: 'progressPercentage',
        header: 'Progress',
        cell: ({ row }) => {
          const val = Number(row.getValue('progressPercentage') || 0);
          return <span className="text-xs font-semibold">{val}%</span>;
        },
      },
      {
        id: 'paymentStatus',
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
    []
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
      {/* Top Filter and Action Bar */}
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

        {/* Right Buttons: Columns visibility & CSV export */}
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

      {/* TanStack Table Container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-xs">
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
