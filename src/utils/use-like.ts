import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

type LikeType = 'book' | 'chapter';

const STORAGE_KEY = (type: LikeType, id: number) => `liked_${type}_${id}`;

async function fetchLikeCount(type: LikeType, targetId: number): Promise<number> {
  const { data, error } = await supabase
    .from('Like')
    .select('count')
    .eq('type', type)
    .eq('target_id', targetId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data?.count ?? 0;
}

async function incrementLike(type: LikeType, targetId: number): Promise<void> {
  const { error } = await supabase.rpc('increment_like', {
    p_type: type,
    p_target_id: targetId,
  });
  if (error) throw new Error(error.message);
}

export function useLike(type: LikeType, targetId: number) {
  const queryClient = useQueryClient();
  const storageKey = STORAGE_KEY(type, targetId);

  const [hasLiked, setHasLiked] = useState<boolean>(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  // Sync hasLiked jika targetId berubah (navigasi antar chapter)
  useEffect(() => {
    setHasLiked(localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  const queryKey = ['likes', type, targetId];

  const { data: count = 0, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchLikeCount(type, targetId),
    staleTime: 30 * 1000, // 30 detik
    enabled: !!targetId,
  });

  const mutation = useMutation({
    mutationFn: () => incrementLike(type, targetId),
    onMutate: async () => {
      // Simpan status liked di local storage SEBELUM mutasi agar user tidak klik 2x
      localStorage.setItem(storageKey, 'true');
      setHasLiked(true);

      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<number>(queryKey) ?? 0;

      // Optimis: Langsung tambah 1 di UI
      queryClient.setQueryData(queryKey, prev + 1);

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      // Jika gagal, kembalikan ke angka semula dan hapus tanda 'sudah like'
      queryClient.setQueryData(queryKey, ctx?.prev ?? 0);
      localStorage.removeItem(storageKey);
      setHasLiked(false);
      console.error("Like failed:", err);
    },
    onSettled: () => {
      // Sinkronkan dengan data asli dari DB setelah mutasi selesai
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const like = () => {
    // Cegah mutasi jika sudah pernah like atau sedang proses (loading)
    if (hasLiked || mutation.isPending) return;
    mutation.mutate();
  };

  return { count, hasLiked, like, isLoading };
}
