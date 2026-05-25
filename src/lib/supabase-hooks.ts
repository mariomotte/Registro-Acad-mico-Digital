'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Usuario } from '@/types';

function mapDbRoleToFrontend(dbRole: string): any {
  switch (dbRole) {
    case 'Superusuario': return 'admin';
    case 'Director': return 'director';
    case 'Subdirector': return 'subdirector';
    case 'Docente': return 'docente';
    case 'Auxiliar': return 'auxiliar';
    case 'Psicólogo': return 'psicologo';
    case 'admin': return 'admin';
    case 'director': return 'director';
    case 'subdirector': return 'subdirector';
    case 'docente': return 'docente';
    case 'auxiliar': return 'auxiliar';
    case 'psicologo': return 'psicologo';
    default: return 'docente';
  }
}

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
            .select('id, email, first_name, last_name, role, estado, created_at')
            .eq('id', session.user.id)
            .single();
            
          if (profile && mounted) {
            setUser({
               id: profile.id,
               email: profile.email,
               firstName: profile.first_name,
               lastName: profile.last_name,
               role: mapDbRoleToFrontend(profile.role),
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
               role: mapDbRoleToFrontend(session.user.user_metadata?.role || 'docente'),
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
            .select('id, email, first_name, last_name, role, estado, created_at')
            .eq('id', session.user.id)
            .single();
            
          if (profile && mounted) {
            setUser({
               id: profile.id,
               email: profile.email,
               firstName: profile.first_name,
               lastName: profile.last_name,
               role: mapDbRoleToFrontend(profile.role),
               estado: profile.estado as any,
               createdAt: profile.created_at,
            });
          } else if (mounted) {
             setUser({
               id: session.user.id,
               email: session.user.email || '',
               firstName: session.user.user_metadata?.first_name || '',
               lastName: session.user.user_metadata?.last_name || '',
               role: mapDbRoleToFrontend(session.user.user_metadata?.role || 'docente'),
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
