// ============================================================
//  SUPABASE CONFIGURATION
//  Replace with your own project URL and anon key
// ============================================================
const SUPABASE_URL  = 'https://bdryeyawnjvgovfsqaxv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnlleWF3bmp2Z292ZnNxYXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Njg4MjksImV4cCI6MjA5ODU0NDgyOX0.fFVJXej6aders7wRAr-cIHq6c8K8kzGBZd-srZ_sKeY';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
