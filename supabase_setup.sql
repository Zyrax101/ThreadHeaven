/************************************************************
 * Thread Heaven Database Setup
 * Run this in Supabase Dashboard > SQL Editor
 ************************************************************/

-- 1. Setup 'users' table (for profiles)
CREATE TABLE IF NOT EXISTS public.users (
    email TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    city TEXT,
    zip TEXT,
    country TEXT,
    password_hash TEXT, -- Stored for reference, auth is handled by Supabase Auth
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Setup RLS for 'users'
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to view/update ONLY their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.jwt() ->> 'email' = email);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.jwt() ->> 'email' = email);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = email);


-- 3. Setup RLS for 'orders' (Fixes "No orders" issue)
-- Ensure orders table exists first (it should if you placed an order)
CREATE TABLE IF NOT EXISTS public.orders (
    order_id TEXT PRIMARY KEY,
    customer_email TEXT,
    amount NUMERIC,
    status TEXT,
    items JSONB,
    shipping_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (auth.jwt() ->> 'email' = customer_email);

-- Allow anyone (e.g. server/anon) to insert orders
-- (Strictly speaking this should be service-role only, but for this app arch:)
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);
