const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runTest() {
    console.log("Starting Integration Test...");
    
    // Load env variables
    const envContent = fs.readFileSync('.env.local', 'utf8');
    let supabaseUrl = '';
    let supabaseAnonKey = '';
    
    envContent.split('\n').forEach(line => {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase credentials in .env.local");
        process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const email = `testuser${Math.floor(Math.random() * 10000)}@gmail.com`;
    const password = 'TestPassword123!';
    
    console.log(`1. Creating test user: ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: 'Integration Test User' } }
    });
    
    if (authError) {
        console.error("Failed to create user:", authError.message);
        process.exit(1);
    }
    
    console.log("User created successfully! ID:", authData.user.id);
    
    console.log("2. Testing API Endpoints via localhost:3000...");
    
    // Test a public API route (e.g. GET /api/posts)
    try {
        const res = await fetch('http://localhost:3000/api/posts');
        console.log(`GET /api/posts returned status: ${res.status}`);
        const text = await res.text();
        console.log("Response data (first 500 chars):", text.substring(0, 500));
    } catch (e) {
        console.error("Error hitting /api/posts:", e.message);
    }
    
    console.log("Integration test complete.");
}

runTest();
