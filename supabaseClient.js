import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ynoknjnierwupjgcsnmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlub2tuam5pZXJ3dXBqZ2Nzbm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzIwNTEsImV4cCI6MjA5ODc0ODA1MX0.MunY-L-NBCohba5fThPuDd6ad0--T8oWCAy-xDCtmxw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function loginUser(email, password) {
    const hashed = await hashPassword(password);
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', hashed)
        .single();

    if (error || !data) {
        throw new Error('Invalid email or password');
    }

    localStorage.setItem('user', JSON.stringify(data));
    return data;
}

export async function registerUser(firstName, lastName, username, email, password) {
    const hashed = await hashPassword(password);
    const { data, error } = await supabase
        .from('users')
        .insert([
            {
                first_name: firstName,
                last_name: lastName,
                username: username,
                email: email,
                password_hash: hashed,
                profile_image: '/assets/images/default-avatar.png'
            }
        ])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

export function logoutUser() {
    localStorage.removeItem('user');
}
