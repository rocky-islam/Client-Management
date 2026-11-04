'use client';

import React, { useState, useEffect } from 'react';
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
  KeyRound,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

type SignupStep = 'FORM' | 'OTP';

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<SignupStep>('FORM');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    password: '',
    confirmPassword: '',
  });

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [devWarning, setDevWarning] = useState<string | null>(null);

  // Countdown timer for resend OTP cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // STEP 1: Request OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('আপনার পুরো নাম লিখুন (কমপক্ষে ২ অক্ষর)');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('সঠিক ইমেইল এড্রেস প্রদান করুন');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না!');
      return;
    }

    setLoading(true);
    setDevOtpCode(null);
    setDevWarning(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
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
        throw new Error(data.error || 'ওটিপি পাঠাতে সমস্যা হয়েছে');
      }

      toast.success(data.message || 'ভেরিফিকেশন কোড পাঠানো হয়েছে');
      if (data.devOtp) {
        setDevOtpCode(data.devOtp);
      }
      if (data.warning) {
        setDevWarning(data.warning);
      }
      setStep('OTP');
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'ওটিপি পাঠানো সম্ভব হয়নি। তথ্যগুলো আবার পরীক্ষা করুন।');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP & Finalize Account Creation
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      toast.error('দয়া করে ৬-ডিজিটের ওটিপি কোড দিন');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          otp: cleanOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ভেরিফিকেশন ব্যর্থ হয়েছে');
      }

      toast.success('অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। স্বাগতম, ' + data.user.name);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'ভুল ওটিপি কোড বা মেয়াদের সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

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
        {step === 'FORM' ? (
          // ================= STEP 1: REGISTRATION FORM =================
          <>
            <CardHeader className="space-y-2 text-center pb-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md font-bold text-xl mb-1">
                R
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                নতুন অ্যাকাউন্ট তৈরি করুন
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                নিবন্ধন করতে আপনার তথ্যগুলো দিন। ইমেইল ভেরিফিকেশনের জন্য বিনামূল্যে একটি OTP পাঠানো হবে।
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSendOtp}>
              <CardContent className="space-y-3.5 text-xs">
                {/* Full Name */}
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    পুরো নাম (Full Name) *
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
                    ইমেইল ঠিকানা (Email Address) *
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
                      মোবাইল নম্বর (Phone)
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
                      এজেন্সি / ওয়ার্কস্পেস নাম
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
                      পাসওয়ার্ড *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-9 text-sm h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                      পাসওয়ার্ড নিশ্চিত করুন *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="পুনরায় পাসওয়ার্ড দিন"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-9 text-sm h-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 p-2.5 text-[11px] text-muted-foreground border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    অ্যাকাউন্ট ভেরিফিকেশনের জন্য <strong>Resend</strong> এর মাধ্যমে সরাসরি আপনার ইনবক্সে ৬-ডিজিটের ফ্রি সিকিউরিটি ওটিপি পাঠানো হবে।
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 font-semibold shadow-md gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>ওটিপি কোড পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>ভেরিফিকেশন কোড পাঠান</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center text-xs text-muted-foreground pt-1">
                  ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <LogIn className="h-3 w-3" />
                    <span>লগইন করুন</span>
                  </Link>
                </div>
              </CardFooter>
            </form>
          </>
        ) : (
          // ================= STEP 2: OTP VERIFICATION =================
          <>
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-inner mb-1">
                <KeyRound className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                ইমেইল ওটিপি যাচাই করুন
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                আমরা <strong className="text-foreground">{formData.email}</strong> ঠিকানায় ৬-ডিজিটের একটি গোপন কোড পাঠিয়েছি।
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-4">
                {devOtpCode && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">টেস্ট ওটিপি কোড (Test Mode):</p>
                      <p className="font-mono text-base font-bold tracking-widest text-amber-900 dark:text-amber-200">
                        {devOtpCode}
                      </p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                        {devWarning ||
                          '(আপনার .env ফাইলে RESEND_API_KEY কনফিগার করলে ওটিপি সরাসরি গ্রাহকের ইমেইলে যাবে)'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-semibold text-center block">
                    ৬-ডিজিটের সিকিউরিটি কোড লিখুন
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="text-center font-mono text-2xl tracking-[0.5em] h-14 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500 font-bold"
                  />
                  <p className="text-[11px] text-center text-muted-foreground">
                    কোডের মেয়াদ <strong>১০ মিনিট</strong> থাকবে।
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('FORM')}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>ইমেইল সংশোধন করুন</span>
                  </button>

                  {resendCooldown > 0 ? (
                    <span className="text-muted-foreground font-mono text-[11px]">
                      পুনরায় কোড: 00:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSendOtp()}
                      className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>কোড পুনরায় পাঠান</span>
                    </button>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-11 font-semibold shadow-md gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>যাচাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>যাচাই করে অ্যাকাউন্ট তৈরি করুন</span>
                    </>
                  )}
                </Button>

                <div className="text-center text-xs text-muted-foreground pt-1">
                  ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <LogIn className="h-3 w-3" />
                    <span>লগইন করুন</span>
                  </Link>
                </div>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
