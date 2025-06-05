import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface GolfCourse {
  id: string;
  name: string;
  location: string;
  contact_email: string;
  subdomain: string;
}

interface CourseContextType {
  currentCourse: GolfCourse | null;
  loading: boolean;
  error: string | null;
}

const CourseContext = createContext<CourseContextType>({
  currentCourse: null,
  loading: true,
  error: null,
});

export const useCourse = () => useContext(CourseContext);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [currentCourse, setCurrentCourse] = useState<GolfCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Extract subdomain from hostname
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];
        
        console.log("Detected subdomain:", subdomain);

        // Query Supabase for matching course
        const { data, error: fetchError } = await supabase
          .from('golf_courses')
          .select('*')
          .eq('subdomain', subdomain)
          .single();

        if (fetchError) throw fetchError;
        
        if (!data) {
          setError('Course not found');
          setCurrentCourse(null);
        } else {
          setCurrentCourse(data);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(err.message);
        setCurrentCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, []);

  return (
    <CourseContext.Provider value={{ currentCourse, loading, error }}>
      {children}
    </CourseContext.Provider>
  );
}