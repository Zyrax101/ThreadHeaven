/**
 * Cart Manager - ThreadHeaven
 * Handles shopping cart functionality
 */

class CartManager {
    constructor() {
        this.items = [];
        this.loadFromStorage();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('threadheaven_cart');
        if (saved) {
            try {
                this.items = JSON.parse(saved);
                console.log('[Cart] Loaded', this.items.length, 'items from storage');
            } catch (e) {
                console.warn('[Cart] Failed to parse saved cart');
                this.items = [];
            }
        } else {
            console.log('[Cart] No saved cart found');
        }
    }

    saveToStorage() {
        localStorage.setItem('threadheaven_cart', JSON.stringify(this.items));
        this.updateCartUI();
    }

    addItem(product, quantity = 1, size = null) {
        const existingIndex = this.items.findIndex(
            item => item.id === product.id && item.size === size
        );

        if (existingIndex > -1) {
            this.items[existingIndex].quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                material: product.material,
                size: size,
                quantity: quantity
            });
        }

        this.saveToStorage();
        this.showNotification(`${product.name} added to cart!`);
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.saveToStorage();
    }

    updateQuantity(index, quantity) {
        if (quantity <= 0) {
            this.removeItem(index);
        } else {
            this.items[index].quantity = quantity;
            this.saveToStorage();
        }
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    clear() {
        this.items = [];
        this.saveToStorage();
    }

    updateCartUI() {
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            const count = this.getItemCount();
            cartBtn.innerHTML = `<span class="font-mono text-xs">CART (${count})</span>`;
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        // Add styles if not already added
        if (!document.querySelector('#cart-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'cart-notification-styles';
            styles.textContent = `
                .cart-notification {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                    border: 1px solid var(--accent-gold);
                    color: var(--text-main);
                    padding: 16px 24px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    z-index: 1000;
                    animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                }
                .cart-notification i {
                    color: var(--accent-gold);
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    to {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => notification.remove(), 3000);
    }

    renderCartModal() {
        // Remove existing modal if any
        const existing = document.querySelector('.cart-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'cart-modal-overlay';
        overlay.innerHTML = `
            <div class="cart-modal">
                <div class="cart-header">
                    <h2 class="font-header text-2xl text-white">Your Cart</h2>
                    <button class="cart-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cart-items">
                    ${this.items.length === 0 ? `
                        <div class="cart-empty">
                            <i class="fas fa-shopping-bag"></i>
                            <p>Your cart is empty</p>
                        </div>
                    ` : this.items.map((item, index) => `
                        <div class="cart-item">
                            <div class="cart-item-image">
                                <img src="${item.image_url}" alt="${item.name}">
                            </div>
                            <div class="cart-item-details">
                                <h3 class="font-header">${item.name}</h3>
                                <p class="font-mono text-xs text-muted">${item.material}${item.size ? ` / ${item.size}` : ''}</p>
                                <div class="cart-item-quantity">
                                    <button onclick="cart.updateQuantity(${index}, ${item.quantity - 1})">-</button>
                                    <span>${item.quantity}</span>
                                    <button onclick="cart.updateQuantity(${index}, ${item.quantity + 1})">+</button>
                                </div>
                            </div>
                            <div class="cart-item-price">
                                <span class="text-gold font-mono">$${(item.price * item.quantity).toFixed(0)}</span>
                                <button class="cart-remove-btn" onclick="cart.removeItem(${index}); cart.renderCartModal();">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${this.items.length > 0 ? `
                    <div class="cart-footer">
                        <div class="cart-total">
                            <span class="font-mono text-muted">TOTAL</span>
                            <span class="font-header text-2xl text-gold">$${this.getTotal().toFixed(0)}</span>
                        </div>
                        <button class="btn-checkout" onclick="cart.checkout()">
                            CHECKOUT
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        // Add cart modal styles
        if (!document.querySelector('#cart-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'cart-modal-styles';
            styles.textContent = `
                .cart-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                    z-index: 100;
                    display: flex;
                    justify-content: flex-end;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .cart-modal {
                    width: 100%;
                    max-width: 480px;
                    height: 100%;
                    background: var(--card-bg);
                    border-left: 1px solid var(--border-subtle);
                    display: flex;
                    flex-direction: column;
                    animation: slideInRight 0.3s ease;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .cart-header {
                    padding: 24px;
                    border-bottom: 1px solid var(--border-subtle);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .cart-close-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    transition: color 0.3s;
                }
                .cart-close-btn:hover { color: white; }
                .cart-items {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }
                .cart-empty {
                    text-align: center;
                    padding: 48px;
                    color: var(--text-muted);
                }
                .cart-empty i {
                    font-size: 3rem;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                .cart-item {
                    display: flex;
                    gap: 16px;
                    padding: 16px 0;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .cart-item-image {
                    width: 80px;
                    height: 100px;
                    overflow: hidden;
                    background: var(--bg-main);
                }
                .cart-item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .cart-item-details {
                    flex: 1;
                }
                .cart-item-details h3 {
                    color: white;
                    margin-bottom: 4px;
                }
                .cart-item-quantity {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 12px;
                }
                .cart-item-quantity button {
                    width: 28px;
                    height: 28px;
                    border: 1px solid var(--border-subtle);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-mono);
                    transition: all 0.3s;
                }
                .cart-item-quantity button:hover {
                    border-color: var(--accent-gold);
                    color: var(--accent-gold);
                }
                .cart-item-price {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 8px;
                }
                .cart-remove-btn {
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    transition: color 0.3s;
                }
                .cart-remove-btn:hover { color: #e74c3c; }
                .cart-footer {
                    padding: 24px;
                    border-top: 1px solid var(--border-subtle);
                }
                .cart-total {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .btn-checkout {
                    width: 100%;
                    padding: 16px;
                    background: var(--accent-gold);
                    color: black;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    font-weight: bold;
                    letter-spacing: 0.1em;
                    transition: all 0.3s;
                }
                .btn-checkout:hover {
                    background: white;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // Close button
        overlay.querySelector('.cart-close-btn').addEventListener('click', () => {
            overlay.remove();
        });
    }

    async checkout() {
        if (this.items.length === 0) return;

        // Close cart modal
        const cartModal = document.querySelector('.cart-modal-overlay');
        if (cartModal) cartModal.remove();

        // Show checkout modal
        this.showCheckoutModal();
    }

    async showCheckoutModal() {
        // Load dependencies first
        await this.loadDependencies();

        const overlay = document.createElement('div');
        overlay.className = 'checkout-overlay';
        overlay.innerHTML = `
            <div class="checkout-modal">
                <button class="checkout-close-btn">
                    <i class="fas fa-times"></i>
                </button>
                <div class="checkout-content">
                    <h2 class="font-header text-3xl text-white mb-6">Checkout</h2>
                    
                    <!-- Order Summary -->
                    <div class="checkout-summary">
                        <h3 class="font-mono text-xs text-muted mb-4">ORDER SUMMARY</h3>
                        ${this.items.map(item => `
                            <div class="checkout-item">
                                <span>${item.name} ${item.size ? `(${item.size})` : ''} x${item.quantity}</span>
                                <span class="text-gold">$${(item.price * item.quantity).toFixed(0)}</span>
                            </div>
                        `).join('')}
                        <div class="checkout-total">
                            <span>Total</span>
                            <span class="text-gold font-header text-xl">$${this.getTotal().toFixed(0)}</span>
                        </div>
                    </div>

                    <!-- Shipping Form -->
                    <form class="checkout-form" id="checkout-form">
                        <h3 class="font-mono text-xs text-muted mb-4">SHIPPING DETAILS</h3>
                        <div class="form-row">
                            <input type="text" placeholder="Full Name" id="checkout-name" required>
                        </div>
                        <div class="form-row">
                            <input type="email" placeholder="Email Address" id="checkout-email" required>
                        </div>
                        <div class="form-row">
                            <input type="text" placeholder="Shipping Address" id="checkout-address" required autocomplete="off">
                        </div>
                        <div class="form-row">
                            <select id="checkout-country" style="width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); color: white; font-family: var(--font-mono); font-size: 0.875rem;">
                                <option value="" disabled selected>Select Country</option>
                            </select>
                        </div>
                        <div class="form-row two-col">
                            <input type="text" placeholder="City" id="checkout-city" required>
                            <input type="text" placeholder="Postal Code" id="checkout-zip" required>
                        </div>

                        <div class="paypal-notice">
                            <i class="fab fa-paypal"></i>
                            You will be redirected to PayPal to complete your payment securely.
                        </div>

                        <button type="submit" class="btn-paypal-checkout">
                            <span class="btn-text">
                                <i class="fab fa-paypal"></i> PAY WITH PAYPAL
                            </span>
                            <span class="btn-loading" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i> PROCESSING...
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        `;

        // Add checkout styles
        if (!document.querySelector('#checkout-styles')) {
            const styles = document.createElement('style');
            styles.id = 'checkout-styles';
            styles.textContent = `
                .checkout-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(8px);
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    animation: fadeIn 0.3s ease;
                }
                .checkout-modal {
                    background: var(--card-bg);
                    max-width: 500px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    border: 1px solid var(--border-subtle);
                    padding: 32px;
                }
                .checkout-close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    color: var(--text-muted);
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                }
                .checkout-close-btn:hover { color: white; }
                .checkout-summary {
                    background: rgba(255,255,255,0.03);
                    padding: 16px;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-subtle);
                }
                .checkout-item {
                    display: flex;
                    justify-content: space-between;
                    font-family: var(--font-mono);
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-bottom: 8px;
                }
                .checkout-total {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid var(--border-subtle);
                    padding-top: 12px;
                    margin-top: 12px;
                    font-family: var(--font-mono);
                }
                .checkout-form input {
                    width: 100%;
                    padding: 14px 16px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border-subtle);
                    color: white;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    transition: border-color 0.3s;
                }
                .checkout-form input:focus {
                    outline: none;
                    border-color: var(--accent-gold);
                }
                .checkout-form input::placeholder {
                    color: var(--text-muted);
                }
                .form-row {
                    margin-bottom: 12px;
                }
                .form-row.two-col {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .paypal-notice {
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    color: #0070ba;
                    margin: 20px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px;
                    background: rgba(0, 112, 186, 0.1);
                    border: 1px solid rgba(0, 112, 186, 0.3);
                }
                .paypal-notice i {
                    font-size: 1.2rem;
                }
                .btn-paypal-checkout {
                    width: 100%;
                    padding: 16px;
                    background: #0070ba;
                    color: white;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    font-weight: bold;
                    letter-spacing: 0.1em;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                .btn-paypal-checkout:hover { 
                    background: #005ea6;
                    transform: translateY(-1px);
                }
                .btn-paypal-checkout:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .success-screen {
                    text-align: center;
                    padding: 48px 24px;
                }
                .success-icon {
                    font-size: 4rem;
                    color: #22c55e;
                    margin-bottom: 24px;
                    animation: scaleIn 0.5s ease;
                }
                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(overlay);

        // Handle form submission
        const form = overlay.querySelector('#checkout-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processPayPalCheckout(overlay);
        });

        // Close handlers
        overlay.querySelector('.checkout-close-btn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // Pre-fill user data if logged in
        if (typeof db !== 'undefined') {
            db.getUserProfile().then(profile => {
                if (profile) {
                    const nameInput = overlay.querySelector('#checkout-name');
                    const emailInput = overlay.querySelector('#checkout-email');
                    const addrInput = overlay.querySelector('#checkout-address');
                    const cityInput = overlay.querySelector('#checkout-city');
                    const zipInput = overlay.querySelector('#checkout-zip');
                    const countryInput = overlay.querySelector('#checkout-country');

                    if (nameInput && profile.name) nameInput.value = profile.name;
                    if (emailInput && profile.email) {
                        emailInput.value = profile.email;
                        emailInput.readOnly = true; // Lock email if logged in
                        emailInput.style.opacity = '0.7';
                    }
                    if (addrInput && profile.address) addrInput.value = profile.address;
                    if (cityInput && profile.city) cityInput.value = profile.city;
                    if (zipInput && profile.zip) zipInput.value = profile.zip;
                    if (countryInput && profile.country) {
                        countryInput.value = profile.country;
                        countryInput.dispatchEvent(new Event('change'));
                    }
                }
            }).catch(console.error);
        }

        // Init Country & Validation
        if (window.populateCountrySelect) {
            populateCountrySelect(overlay.querySelector('#checkout-country'));
        }
        if (window.addressValidator) {
            const addrInput = overlay.querySelector('#checkout-address');
            addressValidator.attach(addrInput, (selected) => {
                addrInput.value = selected.street || selected.display_name;
                overlay.querySelector('#checkout-city').value = selected.city;
                overlay.querySelector('#checkout-zip').value = selected.zip;

                const countrySel = overlay.querySelector('#checkout-country');
                const countryOpt = Array.from(countrySel.options).find(opt => opt.value === selected.country);
                if (countryOpt) {
                    countrySel.value = countryOpt.value;
                    countrySel.dispatchEvent(new Event('change'));
                }
            });
        }
    }

    async loadDependencies() {
        if (!window.AddressValidator) {
            const load = (src) => new Promise((resolve) => {
                if (document.querySelector(`script[src="${src}"]`)) return resolve();
                const s = document.createElement('script');
                s.src = src;
                s.onload = resolve;
                s.onerror = resolve; // Continue even if fails
                document.head.appendChild(s);
            });
            await Promise.all([
                load('js/countries.js'),
                load('js/address-validator.js')
            ]);
        }
    }

    async processPayPalCheckout(overlay) {
        const btn = overlay.querySelector('.btn-paypal-checkout');
        const btnText = btn.querySelector('.btn-text');
        const btnLoading = btn.querySelector('.btn-loading');

        // Get form data
        const customer = {
            email: overlay.querySelector('#checkout-email').value,
            name: overlay.querySelector('#checkout-name').value,
            address: overlay.querySelector('#checkout-address').value,
            city: overlay.querySelector('#checkout-city').value,
            zip: overlay.querySelector('#checkout-zip').value,
            country: overlay.querySelector('#checkout-country').value
        };

        // Validate email
        if (!customer.email || !customer.email.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        // Show loading state
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';

        try {
            // Save order info to localStorage so we can use it after PayPal redirect
            const pendingOrder = {
                customer,
                items: this.items,
                total: this.getTotal(),
                timestamp: Date.now()
            };
            localStorage.setItem('threadheaven_pending_order', JSON.stringify(pendingOrder));

            // Save to Supabase (Client-Side)
            if (typeof db === 'undefined') throw new Error('Database connection failed');

            const orderId = 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);

            await db.createOrder({
                order_id: orderId,
                customer_email: customer.email,
                amount: this.getTotal(),
                status: 'pending',
                items: this.items,
                shipping_address: `${customer.address}, ${customer.city}, ${customer.zip}, ${customer.country}`
            });

            const result = { success: true, orderId: orderId, emailSent: false };

            if (result.success) {
                console.log('Order created:', result.orderId);

                // Clear cart
                this.clear();

                // Show success message with order ID
                const content = overlay.querySelector('.checkout-content');
                content.innerHTML = `
                    <div class="success-screen">
                        <div class="success-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h2 class="font-header text-3xl text-white mb-4">Order Received!</h2>
                        <p class="font-mono text-sm text-muted mb-2">Your order ID is</p>
                        <p class="font-mono text-lg text-gold mb-6">${result.orderId}</p>
                        <p class="font-mono text-xs text-muted mb-4">
                            ${result.emailSent ? 'A confirmation email has been sent to' : 'Confirmation will be sent to'}<br>
                            <strong class="text-white">${customer.email}</strong>
                        </p>
                        <p class="font-mono text-sm text-muted mb-6">
                            Click below to complete payment via PayPal:
                        </p>
                        <a href="https://www.paypal.com/ncp/payment/H5VU57MBUX9EL" target="_blank" class="btn-paypal-checkout">
                            <i class="fab fa-paypal"></i> COMPLETE PAYMENT
                        </a>
                        <button class="btn-continue" onclick="document.querySelector('.checkout-overlay').remove()" style="
                            margin-top: 16px;
                            width: 100%;
                            padding: 12px;
                            background: transparent;
                            border: 1px solid var(--border-subtle);
                            color: var(--text-muted);
                            font-family: var(--font-mono);
                            font-size: 0.75rem;
                            cursor: pointer;
                        ">
                            CONTINUE SHOPPING
                        </button>
                    </div>
                `;
            } else {
                throw new Error(result.error || 'Failed to create order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            btn.disabled = false;
            btnText.style.display = 'inline-flex';
            btnLoading.style.display = 'none';
            alert('There was an error processing your order. Please try again.');
        }
    }
}

// Global instance
const cart = new CartManager();

// Initialize cart UI on load
document.addEventListener('DOMContentLoaded', () => {
    cart.updateCartUI();

    // Add click event to cart button
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => cart.renderCartModal());
    }
});
