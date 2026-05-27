import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Proyecto Supabase activo (MCP). El ref antiguo rveqsehzlvbttlpmsbmi ya no resuelve en DNS. */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://cckrnifvbrwuagzlsrbj.supabase.co';
/** Legacy anon: más fiable en WebSocket Realtime que sb_publishable en algunas versiones del SDK. */
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '__REDACTED_JWT__';

let supabaseClient: SupabaseClient | null = null;

/**
 * Cliente Supabase para Realtime (broadcast).
 * El chat no usa JWT de NewApi en el WebSocket — solo apikey anon/publishable.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          apikey: SUPABASE_ANON_KEY,
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseClient;
}

/** @deprecated Usar getSupabaseClient() */
export const supabase = getSupabaseClient();

/** No-op: broadcast no requiere JWT de la API .NET */
export function updateSupabaseAuth(_token: string | null): void {}

export const checkRealtimeConnection = async (): Promise<boolean> => {
  const client = getSupabaseClient();
  return new Promise((resolve) => {
    const channel = client.channel('connection-test');
    const timeout = setTimeout(() => {
      void client.removeChannel(channel);
      resolve(false);
    }, 8000);

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        void client.removeChannel(channel);
        resolve(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timeout);
        void client.removeChannel(channel);
        resolve(false);
      }
    });
  });
};

export const getRealtimeStatus = () => getSupabaseClient().realtime.connectionState();
