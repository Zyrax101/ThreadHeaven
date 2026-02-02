/**
 * Main Application - ThreadHeaven
 * Handles product display and interactions
 */

class ThreadHeavenApp {
    constructor() {
        this.products = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        const startTime = Date.now();
        const loader = document.getElementById('page-loader');

        // Only show loader after 200ms delay (skip if loads fast)
        const loaderTimeout = setTimeout(() => {
            if (loader) loader.style.opacity = '1';
        }, 200);

        // Hide loader initially
        if (loader) loader.style.opacity = '0';

        // Show skeleton loading immediately
        this.showSkeletonLoading();

        try {
            await this.loadProducts();
            this.renderProducts();
            this.initialized = true;
            console.log('✓ ThreadHeaven app initialized');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            // Fallback to static products if database fails
            this.products = this.getStaticProducts();
            this.renderProducts();
        }

        // Clear timeout if not triggered yet
        clearTimeout(loaderTimeout);

        const loadTime = Date.now() - startTime;

        // If loaded fast (<200ms), just remove loader instantly
        if (loadTime < 200) {
            if (loader) loader.remove();
        } else {
            this.hidePageLoader();
        }
    }

    hidePageLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.add('hidden');
            // Remove from DOM after fade out
            setTimeout(() => loader.remove(), 500);
        }
    }

    showSkeletonLoading() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        // Show 6 skeleton cards
        grid.innerHTML = Array(6).fill().map(() => `
            <div class="skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text skeleton-text-short"></div>
                <div class="skeleton skeleton-text-tiny"></div>
            </div>
        `).join('');
    }

    async loadProducts() {
        try {
            this.products = await db.getProducts();
        } catch (error) {
            console.warn('Could not load from database, using static products');
            this.products = this.getStaticProducts();
        }
    }

    getStaticProducts() {
        return [
            {
                id: 1,
                name: 'Onyx Jacket',
                material: 'LEATHER',
                price: 285,
                image_url: 'assets/pants/pants.png',
                rotation: 'rot-1'
            },
            {
                id: 2,
                name: 'Tech Cargo',
                material: 'NYLON',
                price: 120,
                image_url: 'assets/pants/pants.png',
                rotation: 'rot-2'
            },
            {
                id: 3,
                name: 'The Overcoat',
                material: 'WOOL',
                price: 345,
                image_url: 'assets/pants/pants.png',
                rotation: 'rot-3'
            },
            {
                id: 4,
                name: 'Boxy Tee',
                material: 'COTTON',
                price: 55,
                image_url: 'assets/pants/pants.png',
                rotation: 'rot-2'
            },
            {
                id: 5,
                name: 'Combat Boot',
                material: 'LEATHER',
                price: 210,
                image_url: 'assets/pants/pants.png',
                rotation: 'rot-1'
            },
            {
                id: 6,
                name: 'Tech Parka',
                material: 'FLEECE',
                price: 145,
                image_url: 'assets/pants/pants.png',
                rotation: 'rot-3'
            }
        ];
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) {
            console.error('Products grid not found');
            return;
        }

        const rotations = ['rot-1', 'rot-2', 'rot-3'];
        const tapeRotations = ['rotate(-2deg)', 'rotate(2deg)', 'rotate(3deg)', 'rotate(-1deg)'];

        grid.innerHTML = this.products.map((product, index) => {
            const rotation = product.rotation || rotations[index % 3];
            const tapeRotation = tapeRotations[index % 4];

            return `
                <div class="polaroid ${rotation}" onclick="app.showProductModal('${product.id}')">
                    <div class="tape" style="transform: translateX(-50%) ${tapeRotation};"></div>
                    <div class="polaroid-img-box">
                        <img src="${product.image_url}" class="polaroid-img" alt="${product.name}" loading="lazy">
                    </div>
                    <div class="polaroid-footer">
                        <div>
                            <h3 class="font-header text-lg text-white">${product.name}</h3>
                            <p class="font-mono text-xs text-muted mt-2" style="font-size: 10px;">${product.material}</p>
                        </div>
                        <span class="font-mono text-xs text-gold">$${product.price}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    isPantsProduct(product) {
        const pantsKeywords = ['cargo', 'pants', 'trousers', 'chinos', 'jogger', 'jean', 'denim'];
        const name = (product.name || '').toLowerCase();
        const material = (product.material || '').toLowerCase();
        return pantsKeywords.some(keyword => name.includes(keyword) || material.includes(keyword));
    }

    showProductModal(productId) {
        console.log('Opening product modal for ID:', productId);
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        // Remove existing modal
        const existing = document.querySelector('.product-modal-overlay');
        if (existing) existing.remove();

        const sizes = ['XS', 'S', 'M', 'L', 'XL'];

        const overlay = document.createElement('div');
        overlay.className = 'product-modal-overlay';
        overlay.innerHTML = `
            <div class="product-modal">
                <button class="modal-close-btn">
                    <i class="fas fa-times"></i>
                </button>
                <div class="product-modal-content">
                    <div class="product-modal-image">
                        <img src="${product.image_url}" alt="${product.name}">
                    </div>
                    <div class="product-modal-details">
                        <span class="font-mono text-xs text-muted tracking-widest">${product.material}</span>
                        <h2 class="font-header text-3xl text-white" style="margin: 8px 0 16px;">${product.name}</h2>
                        <span class="font-header text-2xl text-gold">$${product.price}</span>
                        
                        <div class="product-sizes" style="margin-top: 24px;">
                            <span class="font-mono text-xs text-muted">SIZE</span>
                            <div class="size-buttons">
                                ${sizes.map(size => `
                                    <button class="size-btn" data-size="${size}">${size}</button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <button class="btn-add-cart" data-product-id="${product.id}" style="margin-top: 24px;">
                            ADD TO CART
                        </button>
                        
                        ${this.isPantsProduct(product) ? `
                        <a href="https://www.paypal.com/ncp/payment/H5VU57MBUX9EL" target="_blank" class="btn-paypal" style="margin-top: 12px;">
                            <i class="fab fa-paypal"></i> BUY NOW WITH PAYPAL
                        </a>
                        ` : ''}
                        
                        <p class="font-mono text-xs text-muted" style="margin-top: 16px; line-height: 1.6;">
                            ${product.description || 'Premium quality piece from the Thread Heaven archive. Designed for those who appreciate minimal aesthetics and exceptional craftsmanship.'}
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        if (!document.querySelector('#product-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'product-modal-styles';
            styles.textContent = `
                .product-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(8px);
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    animation: fadeIn 0.3s ease;
                }
                .product-modal {
                    background: var(--card-bg);
                    max-width: 900px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    border: 1px solid var(--border-subtle);
                    animation: scaleIn 0.3s ease;
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .modal-close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    z-index: 10;
                    transition: color 0.3s;
                }
                .modal-close-btn:hover { color: white; }
                .product-modal-content {
                    display: grid;
                    grid-template-columns: 1fr;
                }
                @media (min-width: 768px) {
                    .product-modal-content {
                        grid-template-columns: 1fr 1fr;
                    }
                }
                .product-modal-image {
                    aspect-ratio: 3/4;
                    overflow: hidden;
                    background: var(--bg-main);
                }
                .product-modal-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .product-modal-details {
                    padding: 32px;
                }
                .size-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                .size-btn {
                    width: 40px;
                    height: 40px;
                    border: 1px solid var(--border-subtle);
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    transition: all 0.3s;
                }
                .size-btn:hover, .size-btn.selected {
                    border-color: var(--accent-gold);
                    color: var(--accent-gold);
                }
                .size-btn.selected {
                    background: rgba(197, 160, 40, 0.1);
                }
                .btn-add-cart {
                    width: 100%;
                    padding: 16px;
                    background: transparent;
                    border: 1px solid var(--accent-gold);
                    color: var(--accent-gold);
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    letter-spacing: 0.1em;
                    transition: all 0.3s;
                }
                .btn-add-cart:hover {
                    background: var(--accent-gold);
                    color: black;
                }
                .btn-paypal {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    padding: 16px;
                    background: #0070ba;
                    border: none;
                    color: white;
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    letter-spacing: 0.1em;
                    text-decoration: none;
                    transition: all 0.3s;
                }
                .btn-paypal:hover {
                    background: #005ea6;
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(overlay);

        // Size selection
        let selectedSize = null;
        overlay.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedSize = btn.dataset.size;
            });
        });

        // Add to cart
        overlay.querySelector('.btn-add-cart').addEventListener('click', () => {
            cart.addItem(product, 1, selectedSize);
            overlay.remove();
        });

        // Close handlers
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        overlay.querySelector('.modal-close-btn').addEventListener('click', () => {
            overlay.remove();
        });
    }
}

// Global instance
const app = new ThreadHeavenApp();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
