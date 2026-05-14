'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Usuario } from '@/types';

export function useSupabaseAuth() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          // Attempt to fetch profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile && mounted) {
            setUser({
               id: profile.id,
               email: profile.email,
               firstName: profile.first_name,
               lastName: profile.last_name,
               role: profile.role as any,
               estado: profile.estado as any,
               createdAt: profile.created_at,
            });
          } else if (mounted) {
            // Fallback si no existe en la tabla users (ej. trigger falló o eliminado)
            setUser({
               id: session.user.id,
               email: session.user.email || '',
               firstName: session.user.user_metadata?.first_name || '',
               lastName: session.user.user_metadata?.last_name || '',
               role: 'Usuario', // Rol por defecto
               estado: 'Activo',
               createdAt: session.user.created_at,
            });
          }
        } else {
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile && mounted) {
            setUser({
               id: profile.id,
               email: profile.email,
               firstName: profile.first_name,
               lastName: profile.last_name,
               role: profile.role as any,
               estado: profile.estado as any,
               createdAt: profile.created_at,
            });
          } else if (mounted) {
             setUser({
               id: session.user.id,
               email: session.user.email || '',
               firstName: session.user.user_metadata?.first_name || '',
               lastName: session.user.user_metadata?.last_name || '',
               role: 'Usuario',
               estado: 'Activo',
               createdAt: session.user.created_at,
            });
          }
        } else {
          if (mounted) setUser(null);
        }
        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
