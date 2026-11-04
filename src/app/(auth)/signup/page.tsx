'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  ArrowRight,
  Loader2,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

/**
 * ==============================================================================
 * SIGNUP CONFIGURATION:
 * Currently set to Direct Instant Registration (No OTP required).
 * When you verify a custom domain on Resend in the future, you can switch
 * ENABLE_EMAIL_OTP to true to activate 6-digit email OTP verification.
 * ==============================================================================
 */
const ENABLE_EMAIL_OTP = false;

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  /* --- OTP STATE (PRESERVED FOR FUTURE USE WHEN CUSTOM DOMAIN IS ADDED) ---
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  -------------------------------------------------------------------------- */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Direct Registration Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('Please enter your full name (at least 2 characters)');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Direct registration endpoint
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          businessName: formData.businessName.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Account created successfully! Welcome, ' + data.user.name);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  /* --- OTP HANDLERS (PRESERVED FOR FUTURE DOMAIN ACTIVATION) ---
  // Step 1: Send OTP
  // const handleSendOtp = async () => { ... fetch('/api/auth/send-otp') ... };
  // Step 2: Verify OTP
  // const handleVerifyOtp = async () => { ... fetch('/api/auth/verify-otp') ... };
  ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden py-10 transition-colors duration-200">
      {/* Dark/Light Mode Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg shadow-xl border-border/70 backdrop-blur-sm relative z-10 transition-all duration-300">
        <CardHeader className="space-y-2 text-center pb-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md font-bold text-xl mb-1">
            R
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Sign up to manage your freelancing projects, track deadlines, clients, and revenue
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3.5 text-xs">
            {/* Full Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold">
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Md. Rocky Islam"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-9 text-sm h-9"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-9 text-sm h-9"
                />
              </div>
            </div>

            {/* Mobile / Phone Number & Business Name (Side-by-side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+880 1700-000000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-9 text-sm h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="businessName" className="text-xs font-semibold">
                  Agency / Workspace Name
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder="e.g. Rocky Studio"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="pl-9 text-sm h-9"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password (Side-by-side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-9 text-sm h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-9 text-sm h-9"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground border border-border/50 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                By creating an account, you will get complete access to manage your client projects, invoices, and targets.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 font-semibold shadow-md gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <LogIn className="h-3 w-3" />
                <span>Sign In</span>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

/**
 * ==============================================================================
 * NOTE FOR FUTURE OTP RESTORATION:
 * The complete backend API routes (/api/auth/send-otp and /api/auth/verify-otp)
 * and email service (src/lib/email.ts) remain fully implemented and functional.
 * Once you connect and verify your domain in Resend, switch ENABLE_EMAIL_OTP
 * above or re-link the two-step verification flow.
 * ==============================================================================
 */
