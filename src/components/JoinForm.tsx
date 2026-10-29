'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Check } from '@/components/ui/Icons';
import { tr, type Lang } from '@/lib/i18n';

// Player application form on /join and /cs/join. Saves to team_applications in Supabase.

const EMPTY_FORM = {
  name: '',
  email: '',
  age: '',
  location: '',
  specification: 'batsman',
  experience: '',
};

const SPECIFICATIONS: { value: string; en: string; cs: string }[] = [
  { value: 'batsman', en: 'Batsman', cs: 'Pálkař' },
  { value: 'bowler', en: 'Bowler', cs: 'Nadhazovač' },
  { value: 'allrounder', en: 'All-rounder', cs: 'Všestranný hráč' },
  { value: 'wicketkeeper', en: 'Wicket Keeper', cs: 'Brankář' },
  { value: 'wicketkeeper_batsman', en: 'Wicket Keeper / Batsman', cs: 'Brankář / pálkař' },
];

export default function JoinForm({ lang = 'en' }: { lang?: Lang }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(tr(lang, { en: 'Sending your application...', cs: 'Odesíláme vaši přihlášku...' }));
    try {
      if (!isSupabaseConfigured) {
        // Development/preview without a database: simulate success.
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        const { error } = await supabase.from('team_applications').insert([formData]);
        if (error) throw error;
      }
      setFormData(EMPTY_FORM);
      setSubmitted(true);
      toast.success(tr(lang, { en: 'Application received. Welcome to the Spartans!', cs: 'Přihláška dorazila. Vítejte u Spartans!' }));
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(tr(lang, { en: 'Something went wrong. Please try again later.', cs: 'Něco se pokazilo. Zkuste to prosím později.' }));
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  const required = <span className="text-gold">*</span>;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#111111', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 0 },
          success: { iconTheme: { primary: '#CC9901', secondary: '#000000' } },
        }}
      />

      <div className="card bg-panel/95 p-6 backdrop-blur sm:p-10">
        {submitted ? (
          <div className="page-enter flex flex-col items-start gap-4 py-8" role="status">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink">
              <Check size={28} />
            </span>
            <h3 className="font-display text-4xl font-extrabold uppercase">
              {tr(lang, { en: 'Application received', cs: 'Přihláška přijata' })}
            </h3>
            <p className="text-lg text-muted">
              {tr(lang, {
                en: 'Thanks for reaching out. Someone from the committee will contact you soon about your first session.',
                cs: 'Děkujeme za zájem. Někdo z výboru se vám brzy ozve a domluví s vámi první trénink.',
              })}
            </p>
            <button type="button" onClick={() => setSubmitted(false)} className="btn btn-outline mt-2">
              {tr(lang, { en: 'Send another application', cs: 'Odeslat další přihlášku' })}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <h3 className="font-display text-3xl font-extrabold uppercase sm:col-span-2">
              {tr(lang, { en: 'Player application', cs: 'Přihláška hráče' })}
            </h3>
            <div className="sm:col-span-2">
              <label htmlFor="name" className="field-label">
                {tr(lang, { en: 'Full name', cs: 'Jméno a příjmení' })} {required}
              </label>
              <input type="text" id="name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} className="field" required disabled={isSubmitting} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className="field-label">
                {tr(lang, { en: 'Email address', cs: 'E-mailová adresa' })} {required}
              </label>
              <input type="email" id="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} className="field" required disabled={isSubmitting} />
            </div>
            <div>
              <label htmlFor="age" className="field-label">
                {tr(lang, { en: 'Age', cs: 'Věk' })} {required}
              </label>
              <input type="number" inputMode="numeric" id="age" name="age" value={formData.age} onChange={handleChange} min="1" max="99" className="field" required disabled={isSubmitting} />
            </div>
            <div>
              <label htmlFor="location" className="field-label">
                {tr(lang, { en: 'Location', cs: 'Bydliště' })} {required}
              </label>
              <input
                type="text"
                id="location"
                name="location"
                autoComplete="address-level2"
                value={formData.location}
                onChange={handleChange}
                placeholder={tr(lang, { en: 'City, Country', cs: 'Město, země' })}
                className="field"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="specification" className="field-label">
                {tr(lang, { en: 'What do you play?', cs: 'Na jakém postu hrajete?' })} {required}
              </label>
              <select id="specification" name="specification" value={formData.specification} onChange={handleChange} className="field" required disabled={isSubmitting}>
                {SPECIFICATIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s[lang]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="experience" className="field-label">
                {tr(lang, { en: 'Cricket experience', cs: 'Zkušenosti s kriketem' })} {required}
              </label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={4}
                placeholder={tr(lang, {
                  en: 'Where have you played, and for how long?',
                  cs: 'Kde a jak dlouho jste hráli? Pokud s kriketem začínáte, klidně to napište.',
                })}
                className="field resize-y"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={isSubmitting} className="btn btn-gold btn-lg w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {tr(lang, { en: 'Sending...', cs: 'Odesíláme...' })}
                  </>
                ) : (
                  tr(lang, { en: 'Submit application', cs: 'Odeslat přihlášku' })
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
