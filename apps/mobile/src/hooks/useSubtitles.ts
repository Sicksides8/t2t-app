import { useEffect, useMemo, useRef, useState } from 'react';
import { findCue, parseVtt, type VttCue } from '../utils/vttParser';

/**
 * Caché en memoria del proceso. Las claves son URLs de archivos .vtt.
 * El valor es una promesa para deduplicar fetches concurrentes (e.g. al
 * abrir/cerrar el sheet rápido).
 */
const VTT_CACHE = new Map<string, Promise<VttCue[]>>();

async function loadCues(url: string): Promise<VttCue[]> {
  const cached = VTT_CACHE.get(url);
  if (cached) return cached;
  const promise = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al cargar subtítulos`);
    }
    const text = await res.text();
    return parseVtt(text);
  })();
  VTT_CACHE.set(url, promise);
  try {
    return await promise;
  } catch (err) {
    // Si falla, removemos del caché para permitir reintento.
    VTT_CACHE.delete(url);
    throw err;
  }
}

export type UseSubtitlesResult = {
  /** Cue activa para el currentTime actual o null si no hay/aún cargando. */
  activeCue: VttCue | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Carga el VTT de la URL provista (con caché por URL) y devuelve la cue
 * activa para el `currentTime` recibido. Si `url` es null/undefined no
 * fetcha nada y devuelve `activeCue: null`.
 */
export function useSubtitles(url: string | null | undefined, currentTime: number): UseSubtitlesResult {
  const [cues, setCues] = useState<VttCue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      lastUrlRef.current = null;
      setCues([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (lastUrlRef.current === url) return;
    lastUrlRef.current = url;
    setLoading(true);
    setError(null);
    loadCues(url)
      .then((parsed) => {
        if (cancelled) return;
        setCues(parsed);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setCues([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const activeCue = useMemo(() => {
    if (!cues.length || !url) return null;
    return findCue(cues, currentTime);
  }, [cues, currentTime, url]);

  return { activeCue, loading, error };
}
