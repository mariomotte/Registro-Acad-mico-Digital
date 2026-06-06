'use client';

import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Usuario } from '@/types';

function mapDbRoleToFrontend(dbRole: string): any {
  switch (dbRole) {
    case 'Superusuario': return 'admin';
    case 'Director': return 'director';
    case 'Subdirector': return 'subdirector';
    case 'Docente': return 'docente';
    case 'Auxiliar': return 'auxiliar';
    case 'admin': return 'admin';
    case 'director': return 'director';
    case 'subdirector': return 'subdirector';
    case 'docente': return 'docente';
    case 'auxiliar': return 'auxiliar';
    default: return 'docente';
  }
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const setUserFromAuthUser = (authUser: User) => {
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        firstName: authUser.user_metadata?.first_name || '',
        lastName: authUser.user_metadata?.last_name || '',
        role: mapDbRoleToFrontend(authUser.user_metadata?.role || 'docente'),
        estado: 'Activo',
        createdAt: authUser.created_at,
      });
    };

    const loadSessionUser = async (session: Session | null) => {
      if (!session?.user) {
        if (mounted) setUser(null);
        return;
      }

      const authUser = session.user;
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, estado, created_at, tutor_grado, tutor_seccion, tutor_nivel, tutor_anio_escolar')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!mounted) return;

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: mapDbRoleToFrontend(profile.role),
          estado: profile.estado as any,
          createdAt: profile.created_at,
          tutor_grado: profile.tutor_grado,
          tutor_seccion: profile.tutor_seccion,
          tutor_nivel: profile.tutor_nivel,
          tutor_anio_escolar: profile.tutor_anio_escolar,
        });
        return;
      }

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      setUserFromAuthUser(authUser);
    };

    async function fetchUser() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await loadSessionUser(session);
      } catch (err) {
        console.error('Error fetching user:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setLoading(true);

      setTimeout(() => {
        loadSessionUser(session)
          .catch((err) => {
            console.error('Error refreshing auth user:', err);
            if (mounted) setUser(null);
          })
          .finally(() => {
            if (mounted) setLoading(false);
          });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
