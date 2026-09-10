'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Turnstile } from '@/components/site/turnstile';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

const types = ['collab', 'hire', 'tech', 'other'] as const;

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  type: z.enum(types),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(10).max(4000),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const t = useTranslations();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // 送出成功後要重置 widget，否則同一個 token 無法再次使用。
  const [turnstileReset, setTurnstileReset] = useState(0);
  const onToken = useCallback((token: string | null) => setTurnstileToken(token), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'collab' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus('idle');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, turnstileToken }),
      });
      if (!response.ok) throw new Error(String(response.status));
      reset();
      setTurnstileReset((value) => value + 1);
      setStatus('success');
      toast.success(t('contact.success'));
    } catch {
      setStatus('error');
      toast.error(t('contact.failure'));
    }
  });

  const fieldClass =
    'w-full min-h-9 rounded-md border border-divider bg-surface px-2.5 py-1.5 text-[15px] text-text caret-accent outline-none transition-colors hover:border-ink-45 focus-visible:border-accent';
  const labelClass = 'block text-[13px] text-ink-70 mb-1.5';
  const errorClass = 'mt-1 text-[13px] text-accent-2-700';

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="contact-name">
            {t('contact.name')}
          </label>
          <input id="contact-name" className={fieldClass} {...register('name')} />
          {errors.name ? <p className={errorClass}>{t('contact.validationName')}</p> : null}
        </div>
        <div>
          <label className={labelClass} htmlFor="contact-email">
            {t('contact.email')}
          </label>
          <input
            id="contact-email"
            type="email"
            inputMode="email"
            className={fieldClass}
            {...register('email')}
          />
          {errors.email ? <p className={errorClass}>{t('contact.validationEmail')}</p> : null}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="contact-type">
          {t('contact.type')}
        </label>
        <select id="contact-type" className={fieldClass} {...register('type')}>
          {types.map((type) => (
            <option key={type} value={type}>
              {t(`contact.type${type.charAt(0).toUpperCase()}${type.slice(1)}` as never)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="contact-subject">
          {t('contact.subject')}
        </label>
        <input id="contact-subject" className={fieldClass} {...register('subject')} />
        {errors.subject ? <p className={errorClass}>{t('contact.validationSubject')}</p> : null}
      </div>

      <div>
        <label className={labelClass} htmlFor="contact-message">
          {t('contact.message')}
        </label>
        <textarea
          id="contact-message"
          rows={6}
          className={`${fieldClass} resize-y`}
          {...register('message')}
        />
        {errors.message ? <p className={errorClass}>{t('contact.validationMessage')}</p> : null}
      </div>

      <Turnstile onToken={onToken} resetSignal={turnstileReset} />

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('contact.submitting') : t('contact.submit')}
        </Button>
        {status === 'success' ? (
          <p className="text-[15px] text-accent-700">{t('contact.success')}</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-[15px] text-accent-2-700">{t('contact.failure')}</p>
        ) : null}
      </div>
    </form>
  );
}
