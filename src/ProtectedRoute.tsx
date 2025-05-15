import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!session) return <Navigate to="/" replace />;

  return children;
}
