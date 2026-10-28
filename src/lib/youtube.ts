import 'server-only';
import { getSettings } from '@/lib/data';

// Live detection for the club's YouTube channel.
// 1. The channel's public video feed lists recent uploads and streams (free).
// 2. One Data API call (1 quota unit) says which of those are live or scheduled.
// Both are cached for a minute, so at most ~1,440 API calls a day (the free quota is 10,000).

const FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const API = 'https://www.googleapis.com/youtube/v3';

export type Video = {
  id: string;
  title: string;
  published: string;
  thumbnail: string;
  status: 'live' | 'upcoming' | 'none';
  scheduledStart?: string;
};

export type LiveStatus = {
  configured: boolean; // a channel is set
  canDetectLive: boolean; // an API key is set too
  channelUrl: string | null;
  live: Video | null;
  upcoming: Video[];
  recent: Video[];
};

const EMPTY: LiveStatus = { configured: false, canDetectLive: false, channelUrl: null, live: null, upcoming: [], recent: [] };

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

// Entries from the channel's Atom feed (newest first).
export function parseFeed(xml: string): Omit<Video, 'status'>[] {
  const entries = xml.split('<entry>').slice(1);
  return entries
    .map((e) => {
      const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(e)?.[1] ?? '';
      return {
        id,
        title: decode(/<title>([^<]*)<\/title>/.exec(e)?.[1] ?? ''),
        published: /<published>([^<]+)<\/published>/.exec(e)?.[1] ?? '',
        thumbnail: /<media:thumbnail url="([^"]+)"/.exec(e)?.[1] ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    })
    .filter((v) => v.id);
}

type ApiItem = {
  id: string;
  snippet?: { liveBroadcastContent?: string };
  liveStreamingDetails?: { scheduledStartTime?: string; actualStartTime?: string; actualEndTime?: string };
};

// Live/upcoming state per video id from a videos.list response.
export function parseDetails(json: { items?: ApiItem[] }): Map<string, Pick<Video, 'status' | 'scheduledStart'>> {
  const out = new Map<string, Pick<Video, 'status' | 'scheduledStart'>>();
  for (const item of json.items ?? []) {
    const state = item.snippet?.liveBroadcastContent;
    out.set(item.id, {
      status: state === 'live' ? 'live' : state === 'upcoming' ? 'upcoming' : 'none',
      scheduledStart: item.liveStreamingDetails?.scheduledStartTime,
    });
  }
  return out;
}

// Accepts a channel id (UC…), an @handle, or a channel/handle URL.
async function resolveChannelId(channel: string, key?: string): Promise<string | null> {
  const id = /(UC[\w-]{22})/.exec(channel)?.[1];
  if (id) return id;
  const handle = /@([\w.-]+)/.exec(channel)?.[1];
  if (!handle || !key) return null;
  const res = await fetch(`${API}/channels?part=id&forHandle=%40${encodeURIComponent(handle)}&key=${key}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { items?: { id: string }[] };
  return json.items?.[0]?.id ?? null;
}

export async function getLiveStatus(): Promise<LiveStatus> {
  // The channel can be set in Vercel or by admins in Settings.
  const channel = process.env.YOUTUBE_CHANNEL_ID?.trim() || (await getSettings()).youtube_channel?.trim();
  const key = process.env.YOUTUBE_API_KEY?.trim() || undefined;
  if (!channel) return EMPTY;

  try {
    const channelId = await resolveChannelId(channel, key);
    if (!channelId) return { ...EMPTY, configured: true, channelUrl: channelUrlFrom(channel) };
    const channelUrl = `https://www.youtube.com/channel/${channelId}`;

    const feedRes = await fetch(FEED + channelId, { next: { revalidate: 60 } });
    if (!feedRes.ok) throw new Error(`feed ${feedRes.status}`);
    const entries = parseFeed(await feedRes.text()).slice(0, 15);

    let details = new Map<string, Pick<Video, 'status' | 'scheduledStart'>>();
    if (key && entries.length) {
      const res = await fetch(`${API}/videos?part=snippet,liveStreamingDetails&id=${entries.map((e) => e.id).join(',')}&key=${key}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) details = parseDetails(await res.json());
    }

    const videos: Video[] = entries.map((e) => ({ ...e, status: 'none', ...details.get(e.id) }));
    return {
      configured: true,
      canDetectLive: !!key,
      channelUrl,
      live: videos.find((v) => v.status === 'live') ?? null,
      upcoming: videos
        .filter((v) => v.status === 'upcoming')
        .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? '')),
      recent: videos.filter((v) => v.status === 'none').slice(0, 9),
    };
  } catch (err) {
    console.error('YouTube live check failed:', err instanceof Error ? err.message : err);
    return { ...EMPTY, configured: true, channelUrl: channelUrlFrom(channel) };
  }
}

function channelUrlFrom(channel: string) {
  if (/^https?:\/\//.test(channel)) return channel;
  if (channel.startsWith('@')) return `https://www.youtube.com/${channel}`;
  return `https://www.youtube.com/channel/${channel}`;
}
