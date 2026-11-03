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
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency, cn } from '@/lib/utils';
import { calculateTimeLeft } from '@/lib/calculations';
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
  RefreshCw,
  Plus,
  Clock,
  Sparkles,
  Edit2,
  CheckCircle2,
  Briefcase,
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

  // Client Modal State
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientProfileLink, setNewClientProfileLink] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  // Profile List & Custom Profile State
  const [profiles, setProfiles] = useState<string[]>(() => {
    if (initialData?.profileName && !DEFAULT_PROFILES.includes(initialData.profileName)) {
      return [...DEFAULT_PROFILES, initialData.profileName];
    }
    return DEFAULT_PROFILES;
  });
  const [isCustomProfile, setIsCustomProfile] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [customProfileInput, setCustomProfileInput] = useState('');

  // Source List & Custom Source State
  const [sources, setSources] = useState<string[]>(() => {
    if (initialData?.projectSource && !DEFAULT_SOURCES.includes(initialData.projectSource)) {
      return [...DEFAULT_SOURCES, initialData.projectSource];
    }
    return DEFAULT_SOURCES;
  });
  const [isCustomSource, setIsCustomSource] = useState(false);
  const [customSourceModalOpen, setCustomSourceModalOpen] = useState(false);
  const [customSourceInput, setCustomSourceInput] = useState('');

  // Category List & Custom Category State
  const [categories, setCategories] = useState<string[]>(() => {
    if (initialData?.category && !PROJECT_CATEGORIES.includes(initialData.category)) {
      return [...PROJECT_CATEGORIES, initialData.category];
    }
    return PROJECT_CATEGORIES;
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryModalOpen, setCustomCategoryModalOpen] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

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

  // Fetch client list and distinct profiles from existing projects & Profile database
  const fetchClientsAndProfiles = async () => {
    try {
      const [resClients, resProjects, resProfiles] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/projects'),
        fetch('/api/profiles'),
      ]);

      if (resClients.ok) {
        const clientJson = await resClients.json();
        setClients(clientJson.clients || []);
        if (clientJson.clients?.length > 0 && !watch('clientId')) {
          setValue('clientId', clientJson.clients[0].id);
        }
      }

      if (resProfiles.ok) {
        const profileJson = await resProfiles.json();
        const apiProfiles = profileJson.profiles?.map((p: any) => p.name).filter(Boolean) || [];
        if (apiProfiles.length > 0) {
          const combined = initialData?.profileName
            ? Array.from(new Set([initialData.profileName, ...apiProfiles]))
            : apiProfiles;
          setProfiles(combined);
          if (!watch('profileName') && combined.length > 0) {
            setValue('profileName', combined[0]);
          }
        }
      }

      if (resProjects.ok) {
        const prjJson = await resProjects.json();
        const prjs: any[] = prjJson.projects || [];
        const usedSources = Array.from(new Set(prjs.map((p) => p.projectSource).filter(Boolean)));
        if (usedSources.length > 0) {
          setSources((prev) => Array.from(new Set([...prev, ...usedSources])));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClientsAndProfiles();
  }, []);

  // Quick Client Creation
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
          country: newClientCountry.trim() || undefined,
          contactInfo: newClientContact.trim() || undefined,
          profileLink: newClientProfileLink.trim() || undefined,
          clientStatus: 'ACTIVE',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      toast.success(`Client "${data.client.name}" successfully created!`);
      setClients((prev) => [data.client, ...prev]);
      setValue('clientId', data.client.id);
      setClientModalOpen(false);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientCompany('');
      setNewClientCountry('');
      setNewClientContact('');
      setNewClientProfileLink('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreatingClient(false);
    }
  };

  // Quick Profile Addition
  const handleAddCustomProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = customProfileInput.trim();
    if (!val) {
      toast.error('Please enter a profile name');
      return;
    }

    try {
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: val, platform: 'Freelance' }),
      });
    } catch (e) {
      // Non-fatal, local selection still proceeds
    }

    if (!profiles.includes(val)) {
      setProfiles((prev) => [...prev, val]);
    }
    setValue('profileName', val);
    setCustomProfileInput('');
    setProfileModalOpen(false);
    toast.success(`Profile "${val}" added and selected!`);
  };

  // Quick Source Addition
  const handleAddCustomSource = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customSourceInput.trim();
    if (!val) {
      toast.error('Please enter a source name');
      return;
    }
    if (!sources.includes(val)) {
      setSources((prev) => [...prev, val]);
    }
    setValue('projectSource', val);
    setCustomSourceInput('');
    setCustomSourceModalOpen(false);
    toast.success(`Source "${val}" added and selected!`);
  };

  // Quick Category Addition
  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customCategoryInput.trim();
    if (!val) {
      toast.error('Please enter a category name');
      return;
    }
    if (!categories.includes(val)) {
      setCategories((prev) => [...prev, val]);
    }
    setValue('category', val);
    setCustomCategoryInput('');
    setCustomCategoryModalOpen(false);
    toast.success(`Category "${val}" added and selected!`);
  };

  // Quick Order ID Regeneration
  const handleRegenerateOrderId = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newId = `ORD-${defaultYear}-${randomNum}`;
    setValue('orderId', newId);
    toast.info(`Generated new Order ID: ${newId}`);
  };

  // Quick Deadline Presets
  const handleSetDeadlineDays = (days: number) => {
    const startDateVal = watch('startDate') ? new Date(watch('startDate')) : new Date();
    const targetDate = new Date(startDateVal.getTime() + days * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];
    setValue('deadline', dateStr);
    setValue('estimatedDuration', `${days} days`);
    toast.info(`Deadline set to ${dateStr} (+${days} days)`);
  };

  // Quick Delivery Statement Date Presets
  const handleSetStatementDate = (type: 'same' | 'plus2' | 'startDate') => {
    if (type === 'same') {
      const dl = watch('deadline');
      if (dl) setValue('deliveryStatementDate', dl);
    } else if (type === 'plus2') {
      const deadlineVal = watch('deadline') ? new Date(watch('deadline')) : new Date();
      const targetDate = new Date(deadlineVal.getTime() + 2 * 24 * 60 * 60 * 1000);
      setValue('deliveryStatementDate', targetDate.toISOString().split('T')[0]);
    } else if (type === 'startDate') {
      setValue('deliveryStatementDate', watch('startDate'));
    }
  };

  // Quick Advance Payment Percentages
  const handleSetAdvancePercentage = (percent: number) => {
    const totalVal = Number(watch('value') || 0);
    const calculated = Math.round((totalVal * percent) / 100);
    setValue('advancePayment', calculated);
    toast.info(`Advance payment set to ${percent}% (${calculated})`);
  };

  // Submit Handler
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

  // Live Watch Calculations
  const currentProgress = watch('progressPercentage') || 0;
  const projectVal = Number(watch('value') || 0);
  const advanceVal = Number(watch('advancePayment') || 0);
  const outstandingBal = Math.max(0, projectVal - advanceVal);
  const activeCurrency = watch('currency') || 'USD';
  const activeDeadline = watch('deadline');
  const activeStatus = watch('orderStatus') || 'NEW';
  const timeLeftData = activeDeadline ? calculateTimeLeft(activeDeadline, activeStatus) : null;
  const selectedClientId = watch('clientId');
  const selectedClient = clients.find((c) => c.id === selectedClientId);

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

          {/* Project Category with Custom Support */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="category" className="text-xs font-semibold">
                Project Category <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                {isCustomCategory ? 'Select from list' : '+ Type Custom'}
              </button>
            </div>

            {isCustomCategory ? (
              <Input
                placeholder="e.g. Shopify App, AI Agent, Next.js SaaS..."
                {...register('category')}
                className="h-9 text-xs"
              />
            ) : (
              <div className="flex gap-2">
                <select
                  id="category"
                  {...register('category')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Dialog open={customCategoryModalOpen} onOpenChange={setCustomCategoryModalOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-9 px-2 text-xs shrink-0" title="Add new category">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-sm">Add Custom Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <Label className="text-xs">Category Name</Label>
                      <Input
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="e.g. AI Automation, Mobile App..."
                        className="text-xs"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" size="sm" type="button" onClick={() => setCustomCategoryModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" type="button" onClick={handleAddCustomCategory}>
                        Add Category
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {errors.category && <p className="text-[11px] text-destructive">{errors.category.message}</p>}
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
          {/* CLIENT SELECT & QUICK ADD */}
          <div className="space-y-1.5 md:col-span-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientId" className="text-xs font-semibold">
                Client <span className="text-destructive">*</span>
              </Label>
              <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-semibold text-primary border-primary/30 hover:bg-primary/10 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    New Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-primary" />
                      Add New Client On The Fly
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2 text-xs">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Client Full Name *</Label>
                      <Input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="e.g. David Chen, Sarah Miller"
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Company Name</Label>
                        <Input
                          value={newClientCompany}
                          onChange={(e) => setNewClientCompany(e.target.value)}
                          placeholder="e.g. Apex Tech Solutions"
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Country</Label>
                        <Input
                          value={newClientCountry}
                          onChange={(e) => setNewClientCountry(e.target.value)}
                          placeholder="e.g. United States, UK"
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Email Address</Label>
                        <Input
                          type="email"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          placeholder="david@example.com"
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone / WhatsApp</Label>
                        <Input
                          value={newClientContact}
                          onChange={(e) => setNewClientContact(e.target.value)}
                          placeholder="+1 555-0199"
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Profile Link (Fiverr / Upwork / LinkedIn)</Label>
                      <Input
                        value={newClientProfileLink}
                        onChange={(e) => setNewClientProfileLink(e.target.value)}
                        placeholder="https://upwork.com/freelancers/..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" type="button" onClick={() => setClientModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" type="button" disabled={creatingClient} onClick={handleCreateClient}>
                      {creatingClient ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          Saving...
                        </>
                      ) : (
                        'Save & Select Client'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <select
              id="clientId"
              {...register('clientId')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
            {selectedClient && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 inline" />
                Selected: <span className="font-semibold text-foreground">{selectedClient.name}</span>
                {selectedClient.companyName && ` • ${selectedClient.companyName}`}
              </p>
            )}
            {errors.clientId && <p className="text-[11px] text-destructive">{errors.clientId.message}</p>}
          </div>

          {/* PROFILE NAME WITH CUSTOM PROFILE CREATION */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="profileName" className="text-xs font-semibold">
                Profile Name <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setIsCustomProfile(!isCustomProfile)}
                className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                {isCustomProfile ? 'Select from list' : '+ Type Custom'}
              </button>
            </div>

            {isCustomProfile ? (
              <Input
                placeholder="e.g. Upwork Agency, Fiverr Team B, Direct..."
                {...register('profileName')}
                className="h-9 text-xs"
              />
            ) : (
              <div className="flex gap-2">
                <select
                  id="profileName"
                  {...register('profileName')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {profiles.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-9 px-2 text-xs shrink-0" title="Add custom profile">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-sm">Add Custom Profile Name</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <Label className="text-xs">Profile Name</Label>
                      <Input
                        value={customProfileInput}
                        onChange={(e) => setCustomProfileInput(e.target.value)}
                        placeholder="e.g. Upwork Agency, Fiverr Enterprise..."
                        className="text-xs"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" size="sm" type="button" onClick={() => setProfileModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" type="button" onClick={handleAddCustomProfile}>
                        Add Profile
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {errors.profileName && <p className="text-[11px] text-destructive">{errors.profileName.message}</p>}
          </div>

          {/* ORDER ID WITH REGENERATE HELPER */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="orderId" className="text-xs font-semibold">
                Order ID <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={handleRegenerateOrderId}
                className="text-[11px] text-muted-foreground hover:text-primary font-medium inline-flex items-center gap-1"
                title="Generate fresh unique ID"
              >
                <RefreshCw className="h-3 w-3" />
                Auto-Gen
              </button>
            </div>
            <Input id="orderId" placeholder="e.g. ORD-2026-101" {...register('orderId')} className="h-9 font-mono text-xs" />
            {errors.orderId && <p className="text-[11px] text-destructive">{errors.orderId.message}</p>}
          </div>

          {/* SALES TYPE */}
          <div className="space-y-1.5">
            <Label htmlFor="salesType" className="text-xs font-semibold">
              Sales Type
            </Label>
            <select
              id="salesType"
              {...register('salesType')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {SALES_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* PROJECT SOURCE WITH CUSTOM SUPPORT */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="projectSource" className="text-xs font-semibold">
                Project Source <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setIsCustomSource(!isCustomSource)}
                className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                {isCustomSource ? 'Select from list' : '+ Type Custom'}
              </button>
            </div>

            {isCustomSource ? (
              <Input
                placeholder="e.g. WhatsApp Inbound, Friend Referral, YouTube..."
                {...register('projectSource')}
                className="h-9 text-xs"
              />
            ) : (
              <div className="flex gap-2">
                <select
                  id="projectSource"
                  {...register('projectSource')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {sources.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
                <Dialog open={customSourceModalOpen} onOpenChange={setCustomSourceModalOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-9 px-2 text-xs shrink-0" title="Add custom source">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-sm">Add Custom Project Source</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <Label className="text-xs">Source Name</Label>
                      <Input
                        value={customSourceInput}
                        onChange={(e) => setCustomSourceInput(e.target.value)}
                        placeholder="e.g. Client Referral, Facebook Group..."
                        className="text-xs"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" size="sm" type="button" onClick={() => setCustomSourceModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" type="button" onClick={handleAddCustomSource}>
                        Add Source
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {errors.projectSource && <p className="text-[11px] text-destructive">{errors.projectSource.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: FINANCIAL DETAILS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Section 3: Financial Details & Advance Payment
          </CardTitle>
          <CardDescription className="text-xs">
            Contracted project value, transaction currency, and initial advance payment logging
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="value" className="text-xs font-semibold">
              Project Value <span className="text-destructive">*</span>
            </Label>
            <Input id="value" type="number" step="0.01" {...register('value')} className="h-9 font-semibold text-xs" />
            {errors.value && <p className="text-[11px] text-destructive">{errors.value.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currency" className="text-xs font-semibold">
              Currency
            </Label>
            <select
              id="currency"
              {...register('currency')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol} - {c.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="advancePayment" className="text-xs font-semibold">
                Advance Payment Received
              </Label>
              <div className="flex items-center gap-1">
                {[0, 25, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSetAdvancePercentage(pct)}
                    className="text-[10px] bg-muted hover:bg-muted-foreground/20 px-1.5 py-0.5 rounded text-muted-foreground font-mono"
                  >
                    {pct === 100 ? 'Full' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
            <Input id="advancePayment" type="number" step="0.01" {...register('advancePayment')} className="h-9 text-xs" />
            <span className="text-[10px] text-muted-foreground">
              Automatically logs initial payment transaction if &gt; 0.
            </span>
          </div>

          {/* Live Financial Balance Breakdown Card */}
          <div className="md:col-span-3 rounded-lg border bg-muted/30 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 sm:gap-8 flex-wrap">
              <div>
                <span className="text-muted-foreground block text-[11px]">Total Project Value</span>
                <span className="font-bold text-sm text-foreground">{formatCurrency(projectVal, activeCurrency)}</span>
              </div>
              <div className="text-muted-foreground font-light text-base">−</div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Advance Received</span>
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(advanceVal, activeCurrency)}</span>
              </div>
              <div className="text-muted-foreground font-light text-base">=</div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Remaining Outstanding</span>
                <span className="font-bold text-sm text-amber-600 dark:text-amber-400">{formatCurrency(outstandingBal, activeCurrency)}</span>
              </div>
            </div>

            <Badge variant={outstandingBal === 0 && projectVal > 0 ? 'secondary' : advanceVal > 0 ? 'secondary' : 'outline'} className="text-[10px]">
              {outstandingBal === 0 && projectVal > 0 ? 'Full Advance / Cleared' : advanceVal > 0 ? 'Partial Advance Received' : 'Payment Due upon Delivery'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: PROJECT TIMELINE & STATEMENT DATE */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Section 4: Project Timeline & Deadlines
          </CardTitle>
          <CardDescription className="text-xs">
            Project start date, project hard deadline, and delivery statement date
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-xs font-semibold">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Input id="startDate" type="date" {...register('startDate')} className="h-9 text-xs" />
          </div>

          {/* PROJECT DEADLINE WITH PRESET BUTTONS & LIVE TIME LEFT BADGE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="deadline" className="text-xs font-semibold flex items-center gap-1.5">
                <span>Project Deadline</span>
                <span className="text-destructive">*</span>
              </Label>
              {timeLeftData && (
                <span className={cn('text-[10px] font-medium px-1.5 py-0.2 rounded', timeLeftData.badgeColor)}>
                  {timeLeftData.text}
                </span>
              )}
            </div>
            <Input id="deadline" type="date" {...register('deadline')} className="h-9 text-xs" />
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-[10px] text-muted-foreground">Presets:</span>
              {[3, 7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSetDeadlineDays(d)}
                  className="text-[10px] bg-muted hover:bg-muted-foreground/20 px-1.5 py-0.5 rounded text-muted-foreground"
                >
                  +{d}d
                </button>
              ))}
            </div>
            {errors.deadline && <p className="text-[11px] text-destructive">{errors.deadline.message}</p>}
          </div>

          {/* DELIVERY STATEMENT DATE WITH HELPER BUTTONS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="deliveryStatementDate" className="text-xs font-semibold">
                Delivery Statement Date
              </Label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetStatementDate('same')}
                  className="text-[10px] text-primary hover:underline"
                  title="Copy deadline date"
                >
                  = Deadline
                </button>
                <span className="text-muted-foreground text-[10px]">•</span>
                <button
                  type="button"
                  onClick={() => handleSetStatementDate('plus2')}
                  className="text-[10px] text-primary hover:underline"
                  title="Deadline + 2 days"
                >
                  +2d
                </button>
              </div>
            </div>
            <Input id="deliveryStatementDate" type="date" {...register('deliveryStatementDate')} className="h-9 text-xs" />
            <span className="text-[10px] text-muted-foreground">Formal statement or client invoice delivery date</span>
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
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
              Section 6: Monthly Planning Assignment
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
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
              <Input id="assignedYear" type="number" {...register('assignedYear')} className="h-9 text-xs" />
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
              className="h-9 text-xs"
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
              className="h-9 text-xs"
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
