// Supabase Configuration
// Note: In production, these should be loaded from environment variables
// For client-side JS, we use the publishable (anon) key which is safe to expose
const SUPABASE_CONFIG = {
    url: 'https://uwjopxmwmixmhwrdglfk.supabase.co',
    anonKey: 'sb_publishable_JlplytC7IKESVukhgbz-9g_x4hFUFS6'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}
