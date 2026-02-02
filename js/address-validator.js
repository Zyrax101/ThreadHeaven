/**
 * Address Validator using OpenStreetMap (Nominatim)
 */
class AddressValidator {
    constructor() {
        this.timeout = null;
        this.suggestions = [];
        this.currentInput = null;
        this.container = null;
    }

    async search(query, country = '') {
        if (!query || query.length < 3) return [];

        console.log(`[AddressValidator] Searching for "${query}" in "${country}"`);

        return new Promise((resolve, reject) => {
            if (this.timeout) clearTimeout(this.timeout);

            if (this.currentInput) {
                this.toggleLoading(this.currentInput, true);
            }

            this.timeout = setTimeout(async () => {
                try {
                    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;

                    if (country && typeof COUNTRIES !== 'undefined') {
                        const countryObj = COUNTRIES.find(c => c.name === country);
                        if (countryObj) {
                            url += `&countrycodes=${countryObj.code.toLowerCase()}`;
                        }
                    }

                    const response = await fetch(url, { headers: { 'User-Agent': 'ThreadHeaven/1.0' } });
                    if (!response.ok) throw new Error('Search failed');

                    const data = await response.json();
                    console.log(`[AddressValidator] Found ${data.length} results`);

                    this.suggestions = data.map(item => ({
                        display_name: item.display_name,
                        street: item.address.road || item.address.house_number ? `${item.address.house_number || ''} ${item.address.road || ''}`.trim() : '',
                        city: item.address.city || item.address.town || item.address.village || item.address.county || '',
                        state: item.address.state || '',
                        zip: item.address.postcode || '',
                        country: item.address.country || '',
                        lat: item.lat,
                        lon: item.lon
                    }));

                    resolve(this.suggestions);
                } catch (error) {
                    console.error('Address validation error:', error);
                    resolve([]);
                } finally {
                    if (this.currentInput) {
                        this.toggleLoading(this.currentInput, false);
                    }
                }
            }, 500);
        });
    }

    attach(inputElement, onSelect) {
        if (!inputElement) return;

        // Cleanup: remove old container if any attached to this input instance?
        // Since we append to body, we don't want strict duplicates. 
        // But simply creating a new one per attach is safer to avoid state leaks.

        const container = document.createElement('div');
        container.className = 'address-suggestions-dropdown';
        container.style.cssText = `
            position: fixed;
            background: #000;
            border: 1px solid var(--accent-gold, #c5a028);
            max-height: 300px;
            overflow-y: auto;
            z-index: 2000200; /* Higher than Checkout Overlay (2000) */
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            border-radius: 4px;
            box-sizing: border-box;
            font-family: var(--font-sans, sans-serif);
        `;
        document.body.appendChild(container);

        // Loading Icon
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin address-spinner';
        spinner.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--accent-gold, #c5a028);
            display: none;
            pointer-events: none;
            z-index: 10;
        `;

        const parentStyle = window.getComputedStyle(inputElement.parentNode);
        if (parentStyle.position === 'static') {
            inputElement.parentNode.style.position = 'relative';
        }

        if (!inputElement.parentNode.querySelector('.address-spinner')) {
            inputElement.parentNode.appendChild(spinner);
        }

        // Positioning Logic
        const updatePosition = () => {
            const rect = inputElement.getBoundingClientRect();
            // Hide if off screen or input hidden
            if (rect.width === 0 || rect.height === 0 || inputElement.offsetParent === null) {
                container.style.display = 'none';
                return;
            }

            container.style.top = `${rect.bottom}px`;
            container.style.left = `${rect.left}px`;
            container.style.width = `${rect.width}px`;
        };

        inputElement.addEventListener('input', async (e) => {
            this.currentInput = inputElement;
            const query = e.target.value;
            const countrySelect = document.getElementById('profile-country') || document.getElementById('checkout-country');
            const country = countrySelect ? countrySelect.value : '';

            if (query.length < 3) {
                container.style.display = 'none';
                return;
            }

            const results = await this.search(query, country);

            if (results.length > 0) {
                container.innerHTML = results.map((item, index) => `
                    <div class="suggestion-item" data-index="${index}" style="
                        padding: 12px 16px; 
                        cursor: pointer; 
                        border-bottom: 1px solid #1a1a1a; 
                        color: #fff; 
                        background: #000;
                        transition: background 0.2s;
                        display: block;
                    ">
                        <div style="font-weight: 500; font-size: 0.9rem; margin-bottom: 4px; color: var(--accent-gold, #c5a028);">
                            ${item.street || item.city}
                        </div>
                        <div style="font-size: 0.8rem; color: #ccc; line-height: 1.4; white-space: normal;">
                            ${item.display_name}
                        </div>
                    </div>
                `).join('');

                container.style.display = 'block';
                updatePosition();

                container.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        onSelect(results[item.dataset.index]);
                        container.style.display = 'none';
                    });
                    item.addEventListener('mouseover', () => item.style.background = '#1a1a1a');
                    item.addEventListener('mouseout', () => item.style.background = '#000');
                });
            } else {
                container.style.display = 'none';
            }
        });

        // Event Listeners for positioning

        // Capture scroll on ANY element to update position (handle modal scroll)
        const scrollHandler = () => {
            if (container.style.display === 'block') updatePosition();
        };
        window.addEventListener('scroll', scrollHandler, true); // Capture phase
        window.addEventListener('resize', scrollHandler);

        // Hide on click outside
        const clickHandler = (e) => {
            if (e.target !== inputElement && !container.contains(e.target)) {
                container.style.display = 'none';
            }
        };
        document.addEventListener('click', clickHandler);

        // Cleanup on node removal (simplistic check)
        // Ideally we'd observe DOM, but for now this is okay as pages are static or fully reloaded.
        // If checkout modal is removed, this container persists in body.
        // We should hide it if input is removed from DOM.
        // Handled by updatePosition check (offsetParent).
    }

    toggleLoading(input, match) {
        if (!input || !input.parentNode) return;
        const spinner = input.parentNode.querySelector('.address-spinner');
        if (spinner) {
            spinner.style.display = match ? 'block' : 'none';
        }
    }
}

const addressValidator = new AddressValidator();
