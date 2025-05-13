import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sorgpgphidblwrkkypsq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcmdwZ3BoaWRibHdya2t5cHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzU2NzQsImV4cCI6MjA1OTA1MTY3NH0.Z2x2a4eX91escRhq5SBZlZRJ6Ig6apQ6DfaFb7YMMIc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);