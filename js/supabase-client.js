/**
 * Supabase Client - ThreadHeaven
 * Handles all database operations
 */

class SupabaseClient {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Import Supabase from CDN (loaded in HTML)
            if (typeof supabase === 'undefined') {
                console.warn('Supabase SDK not loaded');
                return;
            }

            const { createClient } = supabase;

            this.supabase = createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );

            this.initialized = true;
            console.log('Supabase client initialized');
        } catch (error) {
            console.warn('Could not initialize Supabase:', error);
        }
    }

    // ============ PRODUCTS ============

    async getProducts() {
        await this.init();
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getProductById(id) {
        await this.init();
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async createProduct(product) {
        await this.init();
        const { data, error } = await this.supabase
            .from('products')
            .insert([product])
            .select();

        if (error) throw error;
        return data[0];
    }

    async updateProduct(id, updates) {
        await this.init();
        const { data, error } = await this.supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    }

    async deleteProduct(id) {
        await this.init();
        const { error } = await this.supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    // ============ ORDERS ============

    async getOrders() {
        await this.init();
        const { data, error } = await this.supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (name, price, image_url)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async createOrder(order, items) {
        await this.init();

        // Create order
        const { data: orderData, error: orderError } = await this.supabase
            .from('orders')
            .insert([order])
            .select();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
            ...item,
            order_id: orderData[0].id
        }));

        const { error: itemsError } = await this.supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return orderData[0];
    }

    async updateOrderStatus(id, status) {
        await this.init();
        const { data, error } = await this.supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    }

    // ============ CUSTOMERS ============

    async getCustomers() {
        await this.init();
        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    // ============ ANALYTICS ============

    async getStats() {
        await this.init();

        // Get total products
        const { count: productCount } = await this.supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        // Get total orders
        const { count: orderCount } = await this.supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        // Get total revenue
        const { data: orders } = await this.supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed');

        const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        // Get total customers
        const { count: customerCount } = await this.supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });

        return {
            products: productCount || 0,
            orders: orderCount || 0,
            revenue: totalRevenue,
            customers: customerCount || 0
        };
    }

    // ============ AUTH ============

    async signIn(email, password) {
        await this.init();
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    async signOut() {
        await this.init();
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    async getUser() {
        await this.init();
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    async isAuthenticated() {
        const user = await this.getUser();
        return !!user;
    }
}

// Global instance
const db = new SupabaseClient();
