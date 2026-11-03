export const PROJECT_STATUSES = [
  { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'NOT_STARTED', label: 'Not Started', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'WIP', label: 'WIP', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'PENDING_CLIENT', label: 'Pending Client', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'REVISION', label: 'Revision', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
] as const;

export const SALES_TYPES = [
  { value: 'NEW_ORDER', label: 'New Order' },
  { value: 'REPEAT_ORDER', label: 'Repeat Order' },
] as const;

export const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-slate-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-500' },
  { value: 'HIGH', label: 'High', color: 'text-amber-500' },
  { value: 'URGENT', label: 'Urgent', color: 'text-rose-500 font-bold' },
] as const;

export const DEFAULT_PROFILES = [
  'Fiverr',
  'Upwork',
  'Freelancer',
  'Direct Client',
  'LinkedIn',
  'Personal Website',
  'Other',
];

export const DEFAULT_SOURCES = [
  'Fiverr',
  'Upwork',
  'LinkedIn',
  'Facebook',
  'Referral',
  'Personal Website',
  'Direct Contact',
  'WhatsApp',
  'Email',
  'Other',
];

export const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'PAYONEER', label: 'Payoneer' },
  { value: 'WISE', label: 'Wise' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'UNPAID', label: 'Unpaid', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  { value: 'PAID', label: 'Paid', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { value: 'REFUNDED', label: 'Refunded', color: 'text-slate-600 bg-slate-50 dark:bg-slate-950/30' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'HOSTING', label: 'Hosting' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
];

export const PROJECT_CATEGORIES = [
  'Web Development',
  'Frontend Development',
  'Full Stack Development',
  'UI/UX Design',
  'Mobile App',
  'API Integration',
  'Bug Fixing & Maintenance',
  'SEO & Optimization',
  'Consultation',
  'Other',
];
