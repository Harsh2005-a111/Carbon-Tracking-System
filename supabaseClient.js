// Initialize Supabase
const SUPABASE_URL = 'https://lbxxpcvobmevjvwayaaz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieHhwY3ZvYm1ldmp2d2F5YWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODA3NDQsImV4cCI6MjA3Nzc1Njc0NH0.Myp2WDxkEZIxbpVg4nnTePHz9ZIYh6YsS-sgUXVhDlo';

// Check if Supabase script is loaded
if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Check your HTML head tags.');
}

const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Auth Helper: Redirect if not logged in
function requireAuth() {
    const session = sessionStorage.getItem('org_session');
    if (!session) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(session);
}
