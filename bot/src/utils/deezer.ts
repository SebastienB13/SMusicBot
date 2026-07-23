/**
 * Deezer integration notes:
 * Deezer's audio streams are DRM-protected and Deezer does not offer any public API for
 * third-party audio playback. We only use Deezer's free, keyless public API
 * (https://api.deezer.com) to look up track/playlist/album metadata, then hand that
 * metadata off to YouTube search for actual playback. We deliberately do NOT implement
 * Deezer stream decryption (which would require reverse-engineered DRM keys and violates
 * Deezer's Terms of Service).
 */

export interface DeezerTrack {
  title: string;
  artist: string;
  album?: string;
  durationMs: number;
  link: string;
  cover?: string;
}

export interface DeezerResolveResult {
  type: "track" | "playlist" | "album";
  name?: string;
  tracks: DeezerTrack[];
}

const DEEZER_API = "https://api.deezer.com";

function mapTrack(t: any): DeezerTrack {
  return {
    title: t.title,
    artist: t.artist?.name ?? "Inconnu",
    album: t.album?.title,
    durationMs: (t.duration ?? 0) * 1000,
    link: t.link ?? `https://www.deezer.com/track/${t.id}`,
    cover: t.album?.cover_medium ?? t.cover_medium,
  };
}

export function isDeezerUrl(input: string): boolean {
  return /(?:^|\/\/)(www\.)?deezer\.(com|page\.link)\//i.test(input);
}

export async function searchDeezer(query: string, limit = 5): Promise<DeezerTrack[]> {
  const res = await fetch(`${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error(`Deezer search failed with status ${res.status}`);
  const data = (await res.json()) as { data?: any[] };
  return (data.data ?? []).map(mapTrack);
}

async function followRedirect(url: string): Promise<string> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.url || url;
  } catch {
    return url;
  }
}

export async function resolveDeezerUrl(rawUrl: string): Promise<DeezerResolveResult | null> {
  let url = rawUrl;
  if (/deezer\.page\.link/i.test(url)) {
    url = await followRedirect(url);
  }

  const trackMatch = url.match(/track\/(\d+)/);
  if (trackMatch) {
    const res = await fetch(`${DEEZER_API}/track/${trackMatch[1]}`);
    if (!res.ok) return null;
    const t = (await res.json()) as any;
    if (!t || t.error) return null;
    return { type: "track", tracks: [mapTrack(t)] };
  }

  const playlistMatch = url.match(/playlist\/(\d+)/);
  if (playlistMatch) {
    const res = await fetch(`${DEEZER_API}/playlist/${playlistMatch[1]}`);
    if (!res.ok) return null;
    const p = (await res.json()) as any;
    if (!p || p.error) return null;
    return {
      type: "playlist",
      name: p.title,
      tracks: (p.tracks?.data ?? []).map(mapTrack),
    };
  }

  const albumMatch = url.match(/album\/(\d+)/);
  if (albumMatch) {
    const res = await fetch(`${DEEZER_API}/album/${albumMatch[1]}`);
    if (!res.ok) return null;
    const a = (await res.json()) as any;
    if (!a || a.error) return null;
    return {
      type: "album",
      name: a.title,
      tracks: (a.tracks?.data ?? []).map((t: any) => mapTrack({ ...t, album: { title: a.title }, cover_medium: a.cover_medium })),
    };
  }

  return null;
}
