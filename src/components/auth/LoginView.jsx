import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';

export const LoginView = () => {
  const { login, loading } = useAuth();
  const { isRtl } = useLanguage();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error(isRtl ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }

    try {
      await login(email.trim(), password);
      toast.success(
        isRtl
          ? 'تم تسجيل الدخول بنجاح، مرحباً بك في لوحة تحكم كافيه 90'
          : 'Signed in successfully. Welcome to Cafe 90 Dashboard'
      );
    } catch (err) {
      const msg =
        err.message ||
        (isRtl
          ? 'فشل تسجيل الدخول، يرجى التأكد من صحة البريد الإلكتروني وكلمة المرور'
          : 'Login failed. Please check your credentials');
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#100A06] flex items-center justify-center p-3 sm:p-6 lg:p-10 text-white relative overflow-hidden font-sans">
      {/* CSS fix for browser autofill background color */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 50px #240F08 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          border-radius: 1rem !important;
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(194,139,66,0.16),transparent_35%),radial-gradient(ellipse_at_90%_90%,rgba(94,53,20,0.22),transparent_40%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1120px] min-h-0 lg:min-h-[650px] grid lg:grid-cols-2 overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#170904] shadow-[0_35px_100px_rgba(0,0,0,0.55)]">
        <section
          className="relative min-h-[230px] sm:min-h-[270px] lg:min-h-[650px] bg-cover bg-center p-6 sm:p-10 flex flex-col justify-between overflow-hidden"
          style={{ backgroundImage: "url('/banner_offer_happiness_v2.jpg')" }}
          aria-label={isRtl ? 'قهوة كافيه 90' : 'Cafe 90 coffee'}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A100A]/65 via-[#1A100A]/35 to-[#1A100A]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#130A05]/85 via-transparent to-[#130A05]/25" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <Logo size="default" className="w-36 sm:w-44" />
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-[10px] font-bold tracking-[0.18em] text-white/90 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              CAFE 90 · ADMIN
            </span>
          </div>
          <div className="relative z-10 max-w-md">
            <div className="mb-4 h-px w-12 bg-[#E4C995]" />
            <p className="text-[11px] font-bold tracking-[0.24em] text-[#E4C995]">
              {isRtl ? 'إدارة كافيه 90' : 'CAFE 90 MANAGEMENT'}
            </p>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-[38px] font-extrabold leading-[1.35] text-white">
              {isRtl ? 'كل تفاصيل التشغيل، في مكان واحد.' : 'Every detail of your cafe, in one place.'}
            </h1>
            <p className="mt-3 max-w-sm text-xs sm:text-sm leading-7 text-white/75 hidden sm:block">
              {isRtl ? 'تابع الطلبات والمبيعات وتجربة ضيوفك من لوحة واحدة.' : 'Stay on top of orders, sales, and every guest experience.'}
            </p>
          </div>
          <span className="relative z-10 mt-7 text-[10px] text-white/55 hidden sm:block">
            {isRtl ? 'مساحة الإدارة الخاصة بك' : 'YOUR PRIVATE MANAGEMENT SPACE'}
          </span>
        </section>

        <section className="flex items-center justify-center bg-[#170904] px-6 py-9 sm:px-10 lg:px-14">
          <div className="w-full max-w-[400px] animate-fade-in">
          <div className="mb-8">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/10 text-gold-300">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-white font-sans tracking-tight">
              {isRtl ? 'تسجيل دخول الإدارة' : 'Admin Sign In'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-400 leading-relaxed">
              {isRtl
                ? 'أدخل بيانات حساب الأدمن للوصول إلى لوحة التحكم والعمليات'
                : 'Enter your credentials to access the management portal'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2">
                {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRtl ? 'ادخل البريد الإلكتروني...' : 'admin@cafe90.com'}
                  className={`w-full py-3.5 bg-[#240F08] border border-[#3E1F13] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 rounded-2xl text-sm text-white placeholder:text-stone-500 outline-none transition-all ${
                    isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'
                  }`}
                  autoComplete="email"
                  required
                />
                <Mail
                  className={`w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                    isRtl ? 'right-3.5' : 'left-3.5'
                  }`}
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2">
                {isRtl ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full py-3.5 bg-[#240F08] border border-[#3E1F13] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 rounded-2xl text-sm text-white placeholder:text-stone-500 outline-none transition-all ${
                    isRtl ? 'pr-11 pl-11' : 'pl-11 pr-11'
                  }`}
                  autoComplete="current-password"
                  required
                />
                <Lock
                  className={`w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                    isRtl ? 'right-3.5' : 'left-3.5'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-stone-400 hover:text-gold-400 p-1.5 transition-colors cursor-pointer ${
                    isRtl ? 'left-2.5' : 'right-2.5'
                  }`}
                  title={showPassword ? (isRtl ? 'إخفاء كلمة المرور' : 'Hide') : (isRtl ? 'إظهار كلمة المرور' : 'Show')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center pt-0.5">
              <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-gold-500 border-stone-600 bg-[#240F08] cursor-pointer"
                />
                <span>{isRtl ? 'تذكرني على هذا الجهاز' : 'Remember me on this device'}</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full justify-center font-bold tracking-wide mt-2 py-4 text-sm rounded-2xl shadow-[0_12px_30px_rgba(212,160,55,0.16)] hover:shadow-[0_16px_34px_rgba(212,160,55,0.23)] active:scale-[0.99] transition-all"
              loading={loading}
              icon={isRtl ? ArrowLeft : ArrowRight}
              iconPosition="right"
            >
              {isRtl ? 'تسجيل الدخول إلى الداشبورد' : 'Sign In to Dashboard'}
            </Button>
          </form>
          </div>
        </section>
      </div>
    </div>
  );
};
