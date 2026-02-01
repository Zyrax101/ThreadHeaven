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
            } catch (e) {
                this.items = [];
            }
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

    showCheckoutModal() {
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

                    <!-- Payment Form -->
                    <form class="checkout-form" id="payment-form">
                        <h3 class="font-mono text-xs text-muted mb-4">SHIPPING DETAILS</h3>
                        <div class="form-row">
                            <input type="text" placeholder="Full Name" id="checkout-name" required>
                        </div>
                        <div class="form-row">
                            <input type="email" placeholder="Email Address" id="checkout-email" required>
                        </div>
                        <div class="form-row">
                            <input type="text" placeholder="Shipping Address" id="checkout-address" required>
                        </div>
                        <div class="form-row two-col">
                            <input type="text" placeholder="City" id="checkout-city" required>
                            <input type="text" placeholder="Postal Code" id="checkout-zip" required>
                        </div>

                        <h3 class="font-mono text-xs text-muted mb-4 mt-6">PAYMENT DETAILS</h3>
                        <div class="form-row">
                            <input type="text" placeholder="Card Number" id="card-number" maxlength="19" required>
                        </div>
                        <div class="form-row two-col">
                            <input type="text" placeholder="MM/YY" id="card-expiry" maxlength="5" required>
                            <input type="text" placeholder="CVC" id="card-cvc" maxlength="4" required>
                        </div>

                        <p class="simulated-notice">
                            <i class="fas fa-info-circle"></i>
                            This is a simulated payment. No real charges will be made.
                        </p>

                        <button type="submit" class="btn-pay">
                            <span class="btn-pay-text">PAY $${this.getTotal().toFixed(0)}</span>
                            <span class="btn-pay-loading" style="display: none;">
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
                .simulated-notice {
                    font-family: var(--font-mono);
                    font-size: 0.7rem;
                    color: var(--accent-gold);
                    margin: 16px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-pay {
                    width: 100%;
                    padding: 16px;
                    background: var(--accent-gold);
                    color: black;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    font-weight: bold;
                    letter-spacing: 0.1em;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .btn-pay:hover { background: white; }
                .btn-pay:disabled {
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
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(overlay);

        // Format card number with spaces
        const cardInput = overlay.querySelector('#card-number');
        cardInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            value = value.match(/.{1,4}/g)?.join(' ') || '';
            e.target.value = value;
        });

        // Format expiry
        const expiryInput = overlay.querySelector('#card-expiry');
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });

        // Handle form submission
        const form = overlay.querySelector('#payment-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processPayment(overlay);
        });

        // Close handlers
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        overlay.querySelector('.checkout-close-btn').addEventListener('click', () => {
            overlay.remove();
        });
    }

    async processPayment(overlay) {
        const btn = overlay.querySelector('.btn-pay');
        const btnText = btn.querySelector('.btn-pay-text');
        const btnLoading = btn.querySelector('.btn-pay-loading');

        // Show loading state
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        // Simulate payment processing (2-3 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

        // Get form data
        const email = overlay.querySelector('#checkout-email').value;
        const name = overlay.querySelector('#checkout-name').value;

        // Create order
        const order = {
            status: 'paid',
            total_amount: this.getTotal(),
            customer_email: email,
            customer_name: name,
            created_at: new Date().toISOString()
        };

        const orderItems = this.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            size: item.size
        }));

        try {
            await db.createOrder(order, orderItems);
        } catch (error) {
            console.warn('Could not save order to database:', error);
        }

        // Show success screen
        const content = overlay.querySelector('.checkout-content');
        const orderId = 'TH-' + Date.now().toString().slice(-8);

        content.innerHTML = `
            <div class="success-screen">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 class="font-header text-3xl text-white mb-4">Payment Successful!</h2>
                <p class="font-mono text-sm text-muted mb-2">Your order has been confirmed</p>
                <p class="font-mono text-lg text-gold mb-6">${orderId}</p>
                <p class="font-mono text-xs text-muted mb-8">
                    A confirmation email has been sent to<br>
                    <strong class="text-white">${email}</strong>
                </p>
                <button class="btn-pay" onclick="document.querySelector('.checkout-overlay').remove()">
                    CONTINUE SHOPPING
                </button>
            </div>
        `;

        // Clear cart
        this.clear();
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
