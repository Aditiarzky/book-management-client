// src/hooks/useVisitCounts.ts
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

type VisitType = 'book' | 'chapter';

const VISIT_KEY_PREFIX = 'visit-tracked';

function trackerKey(type: VisitType, targetId: number) {
  return `${VISIT_KEY_PREFIX}:${type}:${targetId}`;
}

// Query Keys
const visitKeys = {
  all: ['visits'] as const,
  single: (type: VisitType, id: number) => ['visits', type, id] as const,
  list: (type: VisitType, ids: number[]) => ['visits', type, 'list', ...ids.sort((a, b) => a - b)] as const,
};

// Fetch multiple counts
async function fetchVisitCounts(type: VisitType, ids: number[]) {
  if (ids.length === 0) return new Map<number, number>();

  const { data, error } = await supabase
    .from('visits')
    .select('target_id, count')
    .eq('type', type)
    .in('target_id', ids);

  if (error) throw error;

  const map = new Map<number, number>();
  (data || []).forEach((row: { target_id: number; count: number | null }) => {
    map.set(row.target_id, row.count ?? 0);
  });

  ids.forEach((id) => {
    if (!map.has(id)) map.set(id, 0);
  });

  return map;
}

// Increment visit (hanya sekali per session)
async function incrementVisit(type: VisitType, targetId: number) {
  if (sessionStorage.getItem(trackerKey(type, targetId))) return null;

  const { error } = await supabase.rpc('increment_visit_count', {
    t_type: type,
    t_id: targetId
  });

  if (error) throw error;

  sessionStorage.setItem(trackerKey(type, targetId), '1');
  return true;
}

// ==================== SINGLE COUNTER (tanpa useEffect) ====================
export function useVisitCounter(type: VisitType, targetId?: number, enabled = true) {
  const queryClient = useQueryClient();
  const hasTracked = useRef(false);

  const query = useQuery({
    queryKey: visitKeys.single(type, targetId!),
    queryFn: () => fetchVisitCounts(type, [targetId!]).then(map => map.get(targetId!) ?? 0),
    enabled: !!targetId && enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const mutation = useMutation({
    mutationFn: () => incrementVisit(type, targetId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.single(type, targetId!) });
      queryClient.invalidateQueries({ queryKey: visitKeys.all });
    },
  });

  if (
    enabled &&
    targetId &&
    !hasTracked.current &&
    query.isSuccess &&
    !sessionStorage.getItem(trackerKey(type, targetId))
  ) {
    hasTracked.current = true;
    mutation.mutate();
  }

  return { count: query.data ?? 0 };
}

// ==================== LIST COUNTS (per-ID cache, no refetch on load more) ====================
export function useVisitCounts(type: VisitType, targetIds: number[]) {
  const uniqueIds = useMemo(() =>
    [...new Set(targetIds)].filter(Boolean),
    [targetIds]
  );

  const results = useQueries({
    queries: uniqueIds.map(id => ({
      queryKey: visitKeys.single(type, id),
      queryFn: () => fetchVisitCounts(type, [id]).then(map => map.get(id) ?? 0),
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });

  return useMemo(() => {
    const obj: Record<number, number> = {};
    uniqueIds.forEach((id, i) => { obj[id] = results[i]?.data ?? 0; });
    return obj;
  }, [uniqueIds, results]);
}
