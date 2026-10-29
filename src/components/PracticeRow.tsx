import type { Practice } from '@/types/supabase';
import { dateParts, formatTime, titleCase } from '@/lib/format';
import { Clock, MapPin } from '@/components/ui/Icons';
import { PRACTICE_TYPE_LABEL } from '@/lib/club';
import type { Lang } from '@/lib/i18n';

export default function PracticeRow({ practice, past, lang = 'en' }: { practice: Practice; past?: boolean; lang?: Lang }) {
  const d = dateParts(practice.date, lang);
  const typeLabel = PRACTICE_TYPE_LABEL[practice.type ?? 'regular']?.[lang] ?? `${titleCase(practice.type)} practice`;
  return (
    <div className={`card flex flex-wrap items-center gap-x-6 gap-y-3 p-5 ${past ? 'opacity-70' : 'card-hover'}`}>
      <div className="w-14 shrink-0 text-center uppercase leading-none">
        <div className={`font-varsity text-[30px] ${past ? '' : 'text-gold'}`}>{d.day}</div>
        <div className="mt-1.5 font-display text-[12px] font-semibold tracking-[0.16em] text-faint">{d.month}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="h-sub text-[22px]">{practice.title || typeLabel}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={15} className="text-faint" />
            {d.weekday} {formatTime(practice.time)}
            {practice.end_time ? `–${formatTime(practice.end_time)}` : ''}
          </span>
          {practice.venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-faint" />
              {practice.venue}
            </span>
          )}
        </div>
        {(practice.description || practice.notes) && (
          <p className="mt-2 text-[14px] text-faint">{practice.description || practice.notes}</p>
        )}
      </div>
    </div>
  );
}
