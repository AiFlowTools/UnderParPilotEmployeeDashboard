import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface UserProfile {
  email: string;
  role: 'employee' | 'admin';
  is_admin: boolean;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'employee' | 'admin' | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setRole(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('email, role, is_admin')
        .eq('id', userId)
        .single();

      console.log('User profile data:', data);

      if (data) {
        setRole(data.role || 'employee');
        setIsAdmin(data.is_admin || false);
        
        console.log('isAdmin:', data.is_admin || false);
        console.log('role:', data.role || 'employee');
      } else {
        setRole('employee');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setRole('employee');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { 
    user, 
    role, 
    isAdmin, 
    loading,
    // Additional helper properties
    isEmployee: role === 'employee',
    isAuthenticated: !!user
  };
}