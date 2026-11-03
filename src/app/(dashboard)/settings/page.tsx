'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Globe,
  Palette,
  Check,
  Loader2,
  DollarSign,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CURRENCIES } from '@/lib/constants';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [dateFormat, setDateFormat] = useState('yyyy-MM-dd');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (res.ok && json.user) {
          setName(json.user.name || '');
          setEmail(json.user.email || '');
          setOriginalEmail(json.user.email || '');
          setBusinessName(json.user.businessName || '');
          setDefaultCurrency(json.user.defaultCurrency || 'USD');
          setTimezone(json.user.timezone || 'Asia/Dhaka');
          setDateFormat(json.user.dateFormat || 'yyyy-MM-dd');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isChangingEmail = email.trim().toLowerCase() !== originalEmail.toLowerCase();
      const isChangingPassword = Boolean(newPassword);

      if (isChangingPassword) {
        if (newPassword.length < 6) {
          toast.error('New password must be at least 6 characters');
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error('New passwords do not match');
          setSaving(false);
          return;
        }
      }

      if ((isChangingEmail || isChangingPassword) && !currentPassword) {
        toast.error('Current password is required to change your login email or password');
        setSaving(false);
        return;
      }

      const payload: any = {
        name,
        email: email.trim(),
        businessName,
        defaultCurrency,
        timezone,
        dateFormat,
      };

      if (currentPassword) {
        payload.currentPassword = currentPassword;
      }

      if (newPassword) {
        payload.newPassword = newPassword;
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      toast.success(data.message || 'Settings updated successfully');
      setOriginalEmail(data.user?.email || email.trim());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEmailModified = email.trim().toLowerCase() !== originalEmail.toLowerCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Settings & Account Preferences
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure business details, login credentials (email & password), currencies, and system themes
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Settings */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Business Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Your freelance brand name and identity
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Your Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Business / Studio Name</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Rocky Freelance Studio"
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECURITY & LOGIN CREDENTIALS */}
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="pb-3 border-b bg-primary/5">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              Security & Login Credentials
            </CardTitle>
            <CardDescription className="text-xs">
              Change the email address and password you use to log in to Rocky Business Manager
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Login Email Address *</span>
                </Label>
                {isEmailModified && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    Email will be updated upon saving
                  </span>
                )}
              </div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
                placeholder="admin@rockybusiness.com"
              />
              <span className="text-[10px] text-muted-foreground">
                You will use this email address to log in to your dashboard.
              </span>
            </div>

            {/* Current Password (Needed for verification) */}
            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Current Password (Required to change Email or Password)</span>
              </Label>
              <Input
                type="password"
                placeholder="Enter current password to authorize changes"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="text-xs max-w-md"
              />
            </div>

            {/* Password Change Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">New Password (Optional)</Label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep existing password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Confirm New Password</Label>
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>
                Passwords are encrypted using bcrypt hashing. Sessions will remain active after credential update.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Localization */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Currency & Localization
            </CardTitle>
            <CardDescription className="text-xs">
              Standard currency for consolidated analytics and dynamic deadline calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Default Currency</Label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
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
              <Label className="text-xs font-semibold">Timezone</Label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Date Format</Label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="yyyy-MM-dd">YYYY-MM-DD (2026-11-03)</option>
                <option value="dd/MM/yyyy">DD/MM/YYYY (03/11/2026)</option>
                <option value="MM/dd/yyyy">MM/DD/YYYY (11/03/2026)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Theme Preferences */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Interface Theme
            </CardTitle>
            <CardDescription className="text-xs">
              Toggle between Light mode, Dark mode, or follow Operating System preference
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex items-center gap-3">
            <Button
              type="button"
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              className="text-xs"
            >
              Light Mode
            </Button>
            <Button
              type="button"
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="text-xs"
            >
              Dark Mode
            </Button>
            <Button
              type="button"
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
              className="text-xs"
            >
              System Default
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving} className="shadow-sm gap-2 text-xs h-9">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Save All Settings</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
