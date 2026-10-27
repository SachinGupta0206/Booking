import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { EventItem } from '../types';

interface UseEventsResult {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await api.listEvents());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { events, loading, error, reload };
}
