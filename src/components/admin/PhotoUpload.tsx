'use client';

import { useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const BUCKETS = ['club-photos', 'sponsor-logos'];

// Shrinks a photo to at most `max` px on its longest side and re-encodes it as JPEG,
// so phone photos (often 5-10 MB) upload quickly and stay small in storage.
async function shrink(file: File, max = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.85),
  );
}

// Bucket and path for a public URL from one of our buckets, or null for anything else.
function storedFile(url?: string | null): { bucket: string; path: string } | null {
  for (const bucket of BUCKETS) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    if (url?.includes(marker)) return { bucket, path: decodeURIComponent(url.split(marker)[1]) };
  }
  return null;
}

// Deletes a replaced or removed photo/logo so storage doesn't fill up with orphans.
export async function removeClubPhoto(supabase: SupabaseClient, url?: string | null) {
  const file = storedFile(url);
  if (file) await supabase.storage.from(file.bucket).remove([file.path]);
}

type Props = {
  supabase: SupabaseClient;
  folder: string; // e.g. "players" or "committee"
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  bucket?: string;
  // "logo" keeps PNG/SVG transparency and shows a square preview.
  kind?: 'photo' | 'logo';
};

export default function PhotoUpload({ supabase, folder, value, onChange, label = 'Photo', bucket = 'club-photos', kind = 'photo' }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setBusy(true);
    try {
      const keep = kind === 'logo' && /png|svg|webp/.test(file.type);
      const blob = keep ? file : await shrink(file);
      const ext = keep ? (file.type.includes('svg') ? 'svg' : file.type.includes('webp') ? 'webp' : 'png') : 'jpg';
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType: keep ? file.type : 'image/jpeg', cacheControl: '31536000' });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className={`h-16 w-16 ring-1 ring-gray-300 ${kind === 'logo' ? 'rounded bg-white object-contain p-1' : 'rounded-full object-cover'}`}
          />
        ) : (
          <span
            className={`flex h-16 w-16 items-center justify-center bg-gray-200 text-xs text-gray-500 ${kind === 'logo' ? 'rounded' : 'rounded-full'}`}
          >
            None
          </span>
        )}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="rounded-md bg-black px-3 py-1.5 text-xs text-white hover:bg-gray-800 disabled:opacity-50 sm:text-sm"
          >
            {busy ? 'Uploading…' : value ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="text-left text-xs text-red-600 hover:text-red-800">
              Remove {label.toLowerCase()}
            </button>
          )}
        </div>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
    </div>
  );
}
