import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required (min 2 characters)'),
  clientId: z.string().min(1, 'Please select or create a client'),
  projectDate: z.string().min(1, 'Order date is required'),
  category: z.string().min(1, 'Category is required'),
  profileName: z.string().min(1, 'Profile name is required (e.g. Fiverr, Upwork, Direct)'),
  orderId: z.string().min(1, 'Order ID is required'),
  projectSource: z.string().min(1, 'Project source is required'),
  description: z.string().optional(),
  value: z.coerce.number().min(0, 'Value must be positive'),
  currency: z.string().default('USD'),
  advancePayment: z.coerce.number().min(0).default(0),
  startDate: z.string().min(1, 'Start date is required'),
  deliveryStatementDate: z.string().optional().nullable(),
  deadline: z.string().min(1, 'Project deadline is required'),
  actualDeliveryDate: z.string().optional().nullable(),
  estimatedDuration: z.string().optional(),
  salesType: z.enum(['NEW_ORDER', 'REPEAT_ORDER']).default('NEW_ORDER'),
  orderStatus: z.enum([
    'NEW',
    'NOT_STARTED',
    'WIP',
    'ON_HOLD',
    'PENDING_CLIENT',
    'REVISION',
    'DELIVERED',
    'CANCELLED',
  ]).default('NEW'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  progressPercentage: z.coerce.number().min(0).max(100).default(0),
  remark: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  attachments: z.string().optional().nullable(),
  // Monthly assignment info
  assignedYear: z.coerce.number().int().default(new Date().getFullYear()),
  assignedMonth: z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const clientSchema = z.object({
  name: z.string().min(2, 'Client name is required'),
  companyName: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  country: z.string().optional().nullable(),
  contactInfo: z.string().optional().nullable(),
  profileLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  clientStatus: z.enum(['ACTIVE', 'INACTIVE', 'LEAD']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const paymentSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  currency: z.string().default('USD'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  transactionRef: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export const expenseSchema = z.object({
  title: z.string().min(2, 'Expense title is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  currency: z.string().default('USD'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  paymentMethod: z.string().default('OTHER'),
  remark: z.string().optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export const targetSchema = z.object({
  targetType: z.string().min(1, 'Target type is required'),
  targetAmount: z.coerce.number().positive('Target amount must be greater than zero'),
  currency: z.string().default('USD'),
  month: z.coerce.number().min(0).max(12).optional().nullable(),
  year: z.coerce.number().int(),
  metricType: z.string().default('RECEIVED_REVENUE'),
});

export type TargetFormData = z.infer<typeof targetSchema>;

export const carryForwardSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  fromMonth: z.coerce.number().int().min(1).max(12),
  fromYear: z.coerce.number().int(),
  toMonth: z.coerce.number().int().min(1).max(12),
  toYear: z.coerce.number().int(),
  reason: z.string().min(2, 'Carry-forward reason is required'),
  remark: z.string().optional().nullable(),
});

export type CarryForwardFormData = z.infer<typeof carryForwardSchema>;

export const taskSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  parentTaskId: z.string().optional().nullable(),
  name: z.string().min(2, 'Task title is required'),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).default('TODO'),
  progress: z.coerce.number().min(0).max(100).default(0),
  remark: z.string().optional().nullable(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  projectId: z.string().optional().nullable(),
  invoiceNumber: z.string().min(2, 'Invoice number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  currency: z.string().default('USD'),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).default('UNPAID'),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Item description is required'),
      quantity: z.coerce.number().positive('Quantity must be > 0'),
      unitPrice: z.coerce.number().min(0, 'Price must be >= 0'),
    })
  ).min(1, 'At least one item is required'),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

