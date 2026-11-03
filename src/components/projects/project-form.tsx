'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, ProjectFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  PROJECT_STATUSES,
  SALES_TYPES,
  PRIORITIES,
  DEFAULT_PROFILES,
  DEFAULT_SOURCES,
  PROJECT_CATEGORIES,
  CURRENCIES,
  MONTH_NAMES,
} from '@/lib/constants';
import { toast } from 'sonner';
import {
  FolderPlus,
  UserPlus,
  Loader2,
  DollarSign,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';

interface ProjectFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export function ProjectForm({ initialData, isEditing = false }: ProjectFormProps) {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addAnother, setAddAnother] = useState(false);

  // Inline Client Creation Dialog State
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;
  const todayStr = now.toISOString().split('T')[0];
  const deadlineDefaultStr = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          clientId: initialData.clientId,
          projectDate: new Date(initialData.projectDate).toISOString().split('T')[0],
          category: initialData.category,
          profileName: initialData.profileName,
          orderId: initialData.orderId,
          projectSource: initialData.projectSource,
          description: initialData.description || '',
          value: Number(initialData.value),
          currency: initialData.currency || 'USD',
          advancePayment: Number(initialData.advancePayment || 0),
          startDate: new Date(initialData.startDate).toISOString().split('T')[0],
          deliveryStatementDate: initialData.deliveryStatementDate
            ? new Date(initialData.deliveryStatementDate).toISOString().split('T')[0]
            : '',
          deadline: new Date(initialData.deadline).toISOString().split('T')[0],
          salesType: initialData.salesType || 'NEW_ORDER',
          orderStatus: initialData.orderStatus || 'NEW',
          priority: initialData.priority || 'MEDIUM',
          progressPercentage: initialData.progressPercentage || 0,
          remark: initialData.remark || '',
          internalNotes: initialData.internalNotes || '',
          attachments: initialData.attachments || '',
          assignedYear: defaultYear,
          assignedMonth: defaultMonth,
        }
      : {
          name: '',
          clientId: '',
          projectDate: todayStr,
          category: 'Web Development',
          profileName: 'Fiverr',
          orderId: `ORD-${defaultYear}-${Math.floor(100 + Math.random() * 900)}`,
          projectSource: 'Fiverr',
          description: '',
          value: 500,
          currency: 'USD',
          advancePayment: 0,
          startDate: todayStr,
          deliveryStatementDate: '',
          deadline: deadlineDefaultStr,
          salesType: 'NEW_ORDER',
          orderStatus: 'NEW',
          priority: 'MEDIUM',
          progressPercentage: 0,
          remark: '',
          internalNotes: '',
          attachments: '',
          assignedYear: defaultYear,
          assignedMonth: defaultMonth,
        },
  });

  // Fetch client list
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
        if (data.clients?.length > 0 && !watch('clientId')) {
          setValue('clientId', data.clients[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      toast.error('Client name is required');
      return;
    }

    setCreatingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName.trim(),
          email: newClientEmail.trim() || undefined,
          companyName: newClientCompany.trim() || undefined,
          clientStatus: 'ACTIVE',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      toast.success(`Client "${data.client.name}" created!`);
      setClients((prev) => [data.client, ...prev]);
      setValue('clientId', data.client.id);
      setClientModalOpen(false);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientCompany('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreatingClient(false);
    }
  };

  const onSubmit = async (formData: ProjectFormData) => {
    setSubmitting(true);
    try {
      const url = isEditing ? `/api/projects/${initialData.id}` : '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save project');
      }

      toast.success(isEditing ? 'Project updated successfully' : 'Project created successfully');

      if (!isEditing && addAnother) {
        reset({
          name: '',
          clientId: formData.clientId,
          projectDate: todayStr,
          category: formData.category,
          profileName: formData.profileName,
          orderId: `ORD-${defaultYear}-${Math.floor(100 + Math.random() * 900)}`,
          projectSource: formData.projectSource,
          description: '',
          value: 0,
          currency: formData.currency,
          advancePayment: 0,
          startDate: todayStr,
          deliveryStatementDate: '',
          deadline: deadlineDefaultStr,
          salesType: 'NEW_ORDER',
          orderStatus: 'NEW',
          priority: 'MEDIUM',
          progressPercentage: 0,
          remark: '',
          internalNotes: '',
          attachments: '',
          assignedYear: defaultYear,
          assignedMonth: defaultMonth,
        });
      } else {
        router.push(isEditing ? `/projects/${initialData.id}` : '/projects');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while saving project');
    } finally {
      setSubmitting(false);
    }
  };

  const currentProgress = watch('progressPercentage');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* SECTION 1: PROJECT DETAILS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Section 1: Project Details
          </CardTitle>
          <CardDescription className="text-xs">
            Core project name, order date, category, and scope description
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="name" className="text-xs font-semibold">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. SaaS Customer Portal & Stripe Integration"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectDate" className="text-xs font-semibold">
              Order Date <span className="text-destructive">*</span>
            </Label>
            <Input id="projectDate" type="date" {...register('projectDate')} />
            {errors.projectDate && <p className="text-[11px] text-destructive">{errors.projectDate.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-semibold">
              Project Category <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              {...register('category')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {PROJECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description" className="text-xs font-semibold">
              Project Scope & Description
            </Label>
            <Textarea
              id="description"
              placeholder="Detailed description of features, tech stack requirements, deliverables..."
              rows={3}
              {...register('description')}
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: CLIENT & SALES */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Section 2: Client & Sales
          </CardTitle>
          <CardDescription className="text-xs">
            Client assignment, platform profile, order identifier, and acquisition channel
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientId" className="text-xs font-semibold">
                Client <span className="text-destructive">*</span>
              </Label>
              <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    + New Client
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-base">Quick Add New Client</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Client Full Name *</Label>
                      <Input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="e.g. Michael Smith"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Company Name</Label>
                      <Input
                        value={newClientCompany}
                        onChange={(e) => setNewClientCompany(e.target.value)}
                        placeholder="e.g. Horizon Labs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email Address</Label>
                      <Input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="michael@horizon.com"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" type="button" onClick={() => setClientModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" type="button" disabled={creatingClient} onClick={handleCreateClient}>
                      {creatingClient ? 'Saving...' : 'Add Client'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <select
              id="clientId"
              {...register('clientId')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" disabled>
                {loadingClients ? 'Loading clients...' : 'Select client'}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ''}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-[11px] text-destructive">{errors.clientId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profileName" className="text-xs font-semibold">
              Profile Name <span className="text-destructive">*</span>
            </Label>
            <select
              id="profileName"
              {...register('profileName')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {DEFAULT_PROFILES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orderId" className="text-xs font-semibold">
              Order ID <span className="text-destructive">*</span>
            </Label>
            <Input id="orderId" placeholder="e.g. ORD-2026-101" {...register('orderId')} />
            {errors.orderId && <p className="text-[11px] text-destructive">{errors.orderId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="salesType" className="text-xs font-semibold">
              Sales Type
            </Label>
            <select
              id="salesType"
              {...register('salesType')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {SALES_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="projectSource" className="text-xs font-semibold">
              Project Source <span className="text-destructive">*</span>
            </Label>
            <select
              id="projectSource"
              {...register('projectSource')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {DEFAULT_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: FINANCIAL DETAILS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Section 3: Financial Details
          </CardTitle>
          <CardDescription className="text-xs">
            Contracted project value, transaction currency, and initial advance payment
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="value" className="text-xs font-semibold">
              Project Value <span className="text-destructive">*</span>
            </Label>
            <Input id="value" type="number" step="0.01" {...register('value')} />
            {errors.value && <p className="text-[11px] text-destructive">{errors.value.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currency" className="text-xs font-semibold">
              Currency
            </Label>
            <select
              id="currency"
              {...register('currency')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol} - {c.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="advancePayment" className="text-xs font-semibold">
              Advance Payment Received
            </Label>
            <Input id="advancePayment" type="number" step="0.01" {...register('advancePayment')} />
            <span className="text-[10px] text-muted-foreground">
              Automatically logs initial payment transaction if &gt; 0.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: PROJECT TIMELINE */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Section 4: Project Timeline
          </CardTitle>
          <CardDescription className="text-xs">
            Start date, client statement delivery date, and hard completion deadline
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-xs font-semibold">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Input id="startDate" type="date" {...register('startDate')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deliveryStatementDate" className="text-xs font-semibold">
              Delivery Statement Date
            </Label>
            <Input id="deliveryStatementDate" type="date" {...register('deliveryStatementDate')} />
            <span className="text-[10px] text-muted-foreground">Formal statement/proposal delivery date</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deadline" className="text-xs font-semibold">
              Project Deadline <span className="text-destructive">*</span>
            </Label>
            <Input id="deadline" type="date" {...register('deadline')} />
            {errors.deadline && <p className="text-[11px] text-destructive">{errors.deadline.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5: STATUS & PROGRESS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Section 5: Status & Priority
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="orderStatus" className="text-xs font-semibold">
              Order Status
            </Label>
            <select
              id="orderStatus"
              {...register('orderStatus')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {PROJECT_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priority" className="text-xs font-semibold">
              Priority
            </Label>
            <select
              id="priority"
              {...register('priority')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="progressPercentage" className="text-xs font-semibold">
                Progress Percentage
              </Label>
              <span className="text-xs font-bold text-primary">{currentProgress}%</span>
            </div>
            <Input
              id="progressPercentage"
              type="range"
              min={0}
              max={100}
              step={5}
              {...register('progressPercentage')}
              className="h-9 cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6: MONTHLY ASSIGNMENT (If creating new) */}
      {!isEditing && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Section 6: Monthly Assignment
            </CardTitle>
            <CardDescription className="text-xs">
              Assign initial month and year for planning and monthly reporting
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="assignedMonth" className="text-xs font-semibold">
                Initial Month
              </Label>
              <select
                id="assignedMonth"
                {...register('assignedMonth')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignedYear" className="text-xs font-semibold">
                Year
              </Label>
              <Input id="assignedYear" type="number" {...register('assignedYear')} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 7: ADDITIONAL INFORMATION */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Section 7: Remarks & Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="remark" className="text-xs font-semibold">
              Public / Table Remark
            </Label>
            <Input
              id="remark"
              placeholder="e.g. Under active frontend integration, design approved"
              {...register('remark')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attachments" className="text-xs font-semibold">
              External File Links / Attachments
            </Label>
            <Input
              id="attachments"
              placeholder="Figma URL, GitHub repo, Drive links..."
              {...register('attachments')}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="internalNotes" className="text-xs font-semibold">
              Internal Notes (Private)
            </Label>
            <Textarea
              id="internalNotes"
              placeholder="Confidential client communication notes, revision logs, internal passwords..."
              rows={2}
              {...register('internalNotes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Submission Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>

        {!isEditing && (
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={submitting}
            onClick={() => setAddAnother(true)}
          >
            Save and Add Another
          </Button>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          onClick={() => setAddAnother(false)}
          className="shadow-sm gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>{isEditing ? 'Update Project' : 'Save Project'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

