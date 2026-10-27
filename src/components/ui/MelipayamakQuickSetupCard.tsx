import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { Button } from './Button';
import { Card } from './Card';
import { FormField } from './FormField';
import { Input } from './Input';
import { StatusBadge } from './StatusBadge';

export const MelipayamakQuickSetupCard: React.FC = () => {
  const { showToast, refreshRealData } = usePrototypeData();
  const navigate = useNavigate();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [maskedSavedKey, setMaskedSavedKey] = useState<string | null>(null);
  const [bodyIdInput, setBodyIdInput] = useState('');
  const [senderInput, setSenderInput] = useState('');
  const [smsConfigured, setSmsConfigured] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);
  const [directEntering, setDirectEntering] = useState(false);
  const [smsStatusMessage, setSmsStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [testPhone, setTestPhone] = useState('09138201042');
  const [testingSms, setTestingSms] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/sms-gateway/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!active || !data?.ok) return;
        setSmsConfigured(Boolean(data.configured));
        setMaskedSavedKey(data.maskedApiKey ?? null);
        if (data.template) setBodyIdInput(String(data.template));
        if (data.sender) setSenderInput(String(data.sender));
      })
      .catch(() => {
        // نادیده گرفتن خطای شبکه در بارگذاری اولیه
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveMelipayamak = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsStatusMessage(null);

    const effectiveKeyToSend =
      apiKeyInput.trim() || (maskedSavedKey ? '__KEEP_EXISTING__' : '');

    if (!effectiveKeyToSend || !bodyIdInput.trim()) {
      setSmsStatusMessage({
        type: 'error',
        text: 'لطفاً هم «کلید وب‌سرویس (یا لینک اشتراکی کنسول ملی‌پیامک)» و هم «کد الگوی پیامک (bodyId)» را وارد کنید.',
      });
      return;
    }

    setSmsSaving(true);
    try {
      const res = await fetch('/api/v1/sms-gateway/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: 'melipayamak',
          apiKey: effectiveKeyToSend,
          template: bodyIdInput.trim(),
          sender: senderInput.trim(),
          phone: testPhone.trim() || '09138201042',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setSmsStatusMessage({
          type: 'error',
          text: data?.message || 'خطا در ذخیره تنظیمات ملی‌پیامک.',
        });
        return;
      }

      setSmsConfigured(Boolean(data.configured));
      setMaskedSavedKey(data.maskedApiKey ?? null);
      setApiKeyInput('');
      if (data?.adminSessionIssued) {
        await refreshRealData();
      }
      setSmsStatusMessage({
        type: 'success',
        text:
          data.message ||
          'درگاه ملی‌پیامک با موفقیت فعال شد! اکنون می‌توانید پیامک تست بفرستید یا مستقیم وارد پنل مدیریت کلان شوید.',
      });
      showToast('درگاه پیامکی ملی‌پیامک فعال شد.');
    } catch {
      setSmsStatusMessage({
        type: 'error',
        text: 'خطا در ارتباط با سرور هنگام ذخیره تنظیمات پیامک.',
      });
    } finally {
      setSmsSaving(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    if (!/^09\d{9}$/.test(testPhone.trim())) {
      setTestResult({
        ok: false,
        message:
          'شماره موبایل را به صورت ۱۱ رقمی صحیح (مثلاً 09138201042) وارد کنید.',
      });
      return;
    }

    setTestingSms(true);
    try {
      const res = await fetch('/api/v1/sms-gateway/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: testPhone.trim(),
          apiKey: apiKeyInput.trim() || undefined,
          template: bodyIdInput.trim() || undefined,
          sender: senderInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data?.adminSessionIssued) {
        await refreshRealData();
      }
      setTestResult({
        ok: Boolean(res.ok && data?.ok),
        message:
          data?.message ||
          (res.ok
            ? 'پیامک تست با موفقیت ارسال شد.'
            : 'ارسال پیامک تست با خطا مواجه شد.'),
      });
    } catch {
      setTestResult({
        ok: false,
        message: 'خطا در برقراری ارتباط با سرور برای ارسال پیامک تست.',
      });
    } finally {
      setTestingSms(false);
    }
  };

  const handleDirectAdminEnter = async () => {
    setDirectEntering(true);
    try {
      const res = await fetch('/api/v1/auth/admin-direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: /^09\d{9}$/.test(testPhone.trim())
            ? testPhone.trim()
            : '09138201042',
        }),
      });
      const data = await res.json();
      await refreshRealData();
      if (res.ok && data?.ok) {
        showToast('نشست مدیر کل فعال شد. خوش آمدید!');
      }
      navigate('/admin', { replace: true });
    } catch {
      navigate('/admin', { replace: true });
    } finally {
      setDirectEntering(false);
    }
  };

  const envSnippet = `SMS_PROVIDER=melipayamak
SMS_API_KEY=${apiKeyInput.trim() || '4373cdb4-d130-49aa-a66c-ec81b5516de0'}
SMS_OTP_TEMPLATE=${bodyIdInput.trim() || '568061'}
SMS_SENDER=${senderInput.trim() || '50004001201042'}
INITIAL_ADMIN_PHONE=${testPhone.trim() || '09138201042'}`;

  const handleCopyEnv = () => {
    navigator.clipboard?.writeText(envSnippet);
    showToast('متغیرهای محیطی ملی‌پیامک کپی شد.');
  };

  return (
    <Card
      padding="lg"
      className="space-y-5 border-2 border-[#0057FF]/25 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#061138] text-[#00E5FF] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#061138]">
              اتصال مستقیم و ۱ دقیقه‌ای پنل پیامک ملی‌پیامک (MelliPayamak)
            </h2>
            <p className="text-xs text-[#64748B]">
              بدون درگیری با تنظیمات پیچیده؛ کلید وب‌سرویس اشتراکی و کد الگو را وارد و در لحظه تست کنید
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={
              smsConfigured
                ? 'درگاه ملی‌پیامک فعال است'
                : 'آماده اتصال کلید ملی‌پیامک'
            }
            tone={smsConfigured ? 'success' : 'warning'}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={directEntering}
            onClick={handleDirectAdminEnter}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {directEntering
                ? 'در حال ورود...'
                : 'ورود مستقیم به پنل مدیریت کلان (/admin)'}
            </span>
          </Button>
        </div>
      </div>

      {/* راهنمای ۲ گام ساده */}
      <div className="p-4 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] space-y-2 text-xs text-[#061138]">
        <p className="font-extrabold text-[#0057FF] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>راهنمای سریع دریافت ۲ مقدار از ملی‌پیامک:</span>
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-[#334155] leading-relaxed">
          <li>
            در پنل <strong>console.melipayamak.com</strong> از منوی{' '}
            <strong>«وب‌سرویس خدماتی (اشتراکی)»</strong> کلید دسترسی یا کل آدرس
            ارسال را کپی کنید و در کادر اول قرار دهید.
          </li>
          <li>
            از بخش <strong>«الگوها (پترن‌ها)»</strong> کد عددی الگوی تاییدشده‌ای که
            شامل یک متغیر <code className="font-mono bg-white px-1 rounded">{'{0}'}</code>{' '}
            است (مثلاً <code className="font-mono">568061</code>) را در کادر دوم
            وارد کنید.
          </li>
        </ol>
      </div>

      <form onSubmit={handleSaveMelipayamak} className="space-y-4">
        <FormField
          id="mp-quick-api-key"
          label="۱. کلید وب‌سرویس اشتراکی (API Key) یا لینک کامل کنسول ملی‌پیامک"
          hint={
            maskedSavedKey
              ? `کلید فعلی ذخیره‌شده: ${maskedSavedKey} (در صورت عدم تغییر، خالی بگذارید)`
              : 'مثال: 4373cdb4-d130-49aa-a66c-ec81b5516de0 یا کل آدرس https://console.melipayamak.com/api/send/shared/...'
          }
          required={!maskedSavedKey}
        >
          <Input
            id="mp-quick-api-key"
            dir="ltr"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={
              maskedSavedKey
                ? `Saved: ${maskedSavedKey} (Paste new key to replace)`
                : '4373cdb4-d130-49aa-a66c-ec81b5516de0'
            }
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="mp-quick-body-id"
            label="۲. کد الگوی پیامک تاییدشده (bodyId)"
            hint="کد عددی پترن در ملی‌پیامک (مثلاً 568061)"
            required
          >
            <Input
              id="mp-quick-body-id"
              dir="ltr"
              value={bodyIdInput}
              onChange={(e) => setBodyIdInput(e.target.value)}
              placeholder="568061"
            />
          </FormField>

          <FormField
            id="mp-quick-sender"
            label="۳. شماره خط اختصاصی (اختیاری)"
            hint="برای وب‌سرویس خدماتی اشتراکی اجباری نیست"
          >
            <Input
              id="mp-quick-sender"
              dir="ltr"
              value={senderInput}
              onChange={(e) => setSenderInput(e.target.value)}
              placeholder="50004001201042"
            />
          </FormField>
        </div>

        {smsStatusMessage ? (
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-bold ${
              smsStatusMessage.type === 'success'
                ? 'bg-[#ECFDF5] border-[#10B981]/40 text-[#065F46]'
                : 'bg-[#FEF2F2] border-[#EF4444]/40 text-[#991B1B]'
            }`}
          >
            {smsStatusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            )}
            <span>{smsStatusMessage.text}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Button type="submit" variant="primary" disabled={smsSaving}>
            <Check className="w-4 h-4" />
            <span>
              {smsSaving
                ? 'در حال ذخیره و فعال‌سازی...'
                : 'ذخیره و فعال‌سازی آنی ملی‌پیامک'}
            </span>
          </Button>

          <button
            type="button"
            onClick={handleCopyEnv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F6FC] hover:bg-[#E0ECFF] border border-[#CBD5E1] text-xs font-bold text-[#061138] cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#0057FF]" />
            <span>کپی متغیرهای آماده برای لیارا (Env)</span>
          </button>
        </div>
      </form>

      {/* بخش تست زنده ارسال پیامک */}
      <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
        <h3 className="text-sm font-extrabold text-[#061138] flex items-center gap-2">
          <Send className="w-4 h-4 text-[#0057FF]" />
          <span>تست زنده ارسال پیامک به موبایل شما</span>
        </h3>
        <form
          onSubmit={handleSendTestSms}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="flex-1">
            <Input
              id="mp-quick-test-phone"
              dir="ltr"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="09138201042"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={testingSms}>
            <Send className="w-4 h-4" />
            <span>
              {testingSms
                ? 'در حال ارسال پیامک...'
                : 'ارسال پیامک تست به موبایل من'}
            </span>
          </Button>
        </form>

        {testResult ? (
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-bold ${
              testResult.ok
                ? 'bg-[#ECFDF5] border-[#10B981]/40 text-[#065F46]'
                : 'bg-[#FEF2F2] border-[#EF4444]/40 text-[#991B1B]'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
};
