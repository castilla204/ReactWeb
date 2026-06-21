import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import type { EmailTemplatePreview } from '../lib/emailTemplateGrouping';

interface RawPreview {
  key?: string; Key?: string;
  label?: string; Label?: string;
  group?: string; Group?: string;
  subject?: string; Subject?: string;
  html?: string; Html?: string;
}

function normalize(r: RawPreview): EmailTemplatePreview {
  return {
    key: r.key ?? r.Key ?? '',
    label: r.label ?? r.Label ?? '',
    group: r.group ?? r.Group ?? '',
    subject: r.subject ?? r.Subject ?? '',
    html: r.html ?? r.Html ?? '',
  };
}

export function useEmailTemplatePreviews() {
  const [previews, setPreviews] = useState<EmailTemplatePreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi<RawPreview[]>(API_CONFIG.endpoints.admin.emailTemplatePreviews);
      setPreviews(Array.isArray(res) ? res.map(normalize) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las plantillas');
      setPreviews([]);
    } finally {
      setIsLoading(false);
    }
    // fetchApi se recrea en cada render (useApi no lo memoiza); excluido de deps a propósito
    // para evitar un bucle de recarga. eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load(); }, [load]);

  return { previews, isLoading, error, reload: load };
}
