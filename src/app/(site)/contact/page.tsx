'use client';

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Check, Facebook, Instagram, Mail } from '@/components/ui/Icons';

const EMPTY_FORM = {
  name: '',
  email: '',
  age: '',
  location: '',
  specification: 'batsman',
  experience: '',
};

const perks = ['All skill levels welcome', 'Regular training and nets', 'League, tournament and friendly cricket', 'Social events all year'];

export default function ContactPage() {
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
    const loadingToast = toast.loading('Sending your application...');
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
      toast.success('Application received. Welcome to the Spartans!');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#111111', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 0 },
          success: { iconTheme: { primary: '#CC9901', secondary: '#000000' } },
        }}
      />

      <section className="relative isolate overflow-hidden">
        <Image src="/spartan_team.PNG" alt="" fill priority sizes="100vw" className="kenburns -z-20 object-cover object-[center_30%]" />
        <div className="absolute inset-0 -z-10 bg-ink/85" />

        <div className="container-x grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow rise mb-4" style={{ ['--d' as string]: '60ms' }}>
              Join the club
            </p>
            <h1 className="display rise text-[clamp(48px,8vw,96px)]" style={{ ['--d' as string]: '140ms' }}>
              Your place <span className="text-gold">in the XI</span>
            </h1>
            <p className="rise mt-6 max-w-lg text-lg leading-relaxed text-sand" style={{ ['--d' as string]: '240ms' }}>
              Interested in playing cricket with the Prague Spartans? Tell us a little about yourself and we&apos;ll be in touch.
            </p>
            <ul className="rise mt-8 flex flex-col gap-3" style={{ ['--d' as string]: '320ms' }}>
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-[16px]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Check size={16} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
            <div className="rise mt-10 flex flex-wrap items-center gap-3 text-muted" style={{ ['--d' as string]: '400ms' }}>
              <a href="mailto:praguespartanscc@gmail.com" className="inline-flex items-center gap-2 text-gold hover:text-gold-hi">
                <Mail size={18} />
                praguespartanscc@gmail.com
              </a>
              <a href="https://www.facebook.com/praguespartans" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="ml-2 flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold">
                <Facebook size={18} />
              </a>
              <a href="https://www.instagram.com/praguespartanscc_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div className="rise card bg-panel/95 p-6 backdrop-blur sm:p-10" style={{ ['--d' as string]: '260ms' }}>
            {submitted ? (
              <div className="page-enter flex flex-col items-start gap-4 py-8">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink">
                  <Check size={28} />
                </span>
                <h2 className="font-display text-4xl font-extrabold uppercase">Application received</h2>
                <p className="text-lg text-muted">
                  Thanks for reaching out. Someone from the committee will contact you soon about your first session.
                </p>
                <button type="button" onClick={() => setSubmitted(false)} className="btn btn-outline mt-2">
                  Send another application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <h2 className="font-display text-3xl font-extrabold uppercase sm:col-span-2">Player application</h2>
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="field-label">
                    Full name <span className="text-gold">*</span>
                  </label>
                  <input type="text" id="name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} className="field" required disabled={isSubmitting} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="field-label">
                    Email address <span className="text-gold">*</span>
                  </label>
                  <input type="email" id="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} className="field" required disabled={isSubmitting} />
                </div>
                <div>
                  <label htmlFor="age" className="field-label">
                    Age <span className="text-gold">*</span>
                  </label>
                  <input type="number" inputMode="numeric" id="age" name="age" value={formData.age} onChange={handleChange} min="10" max="80" className="field" required disabled={isSubmitting} />
                </div>
                <div>
                  <label htmlFor="location" className="field-label">
                    Location <span className="text-gold">*</span>
                  </label>
                  <input type="text" id="location" name="location" autoComplete="address-level2" value={formData.location} onChange={handleChange} placeholder="City, Country" className="field" required disabled={isSubmitting} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="specification" className="field-label">
                    What do you play? <span className="text-gold">*</span>
                  </label>
                  <select id="specification" name="specification" value={formData.specification} onChange={handleChange} className="field" required disabled={isSubmitting}>
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="allrounder">All-rounder</option>
                    <option value="wicketkeeper">Wicket Keeper</option>
                    <option value="wicketkeeper_batsman">Wicket Keeper / Batsman</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="experience" className="field-label">
                    Cricket experience <span className="text-gold">*</span>
                  </label>
                  <textarea id="experience" name="experience" value={formData.experience} onChange={handleChange} rows={4} placeholder="Where have you played, and for how long?" className="field resize-y" required disabled={isSubmitting} />
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={isSubmitting} className="btn btn-gold btn-lg w-full sm:w-auto">
                    {isSubmitting ? (
                      <>
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Submit application'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
