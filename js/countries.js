/**
 * Common countries list
 */
const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'IE', name: 'Ireland' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'JP', name: 'Japan' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'GR', name: 'Greece' },
    { code: 'CZ', name: 'Czech Republic' }
].sort((a, b) => a.name.localeCompare(b.name));

// Helper to populate a select element AND style it custom
function populateCountrySelect(selectElement, defaultCode = 'US') {
    if (!selectElement) return;

    // Clear
    selectElement.innerHTML = '<option value="" disabled>Select Country</option>';

    // Populate native select (hidden but used for form data)
    COUNTRIES.forEach(country => {
        const option = document.createElement('option');
        option.value = country.name;
        option.textContent = country.name;
        if (country.code === defaultCode) option.selected = true;
        option.dataset.code = country.code; // Store code
        selectElement.appendChild(option);
    });

    // Create Custom UI
    createCustomSelect(selectElement);
}

function createCustomSelect(select) {
    // Prevent double init
    if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-container')) {
        select.nextElementSibling.remove();
    }

    select.style.display = 'none'; // Hide native

    const container = document.createElement('div');
    container.className = 'custom-select-container';
    container.style.cssText = `
        position: relative;
        width: 100%;
        font-family: var(--font-mono);
    `;

    const selectedDiv = document.createElement('div');
    selectedDiv.className = 'select-selected';
    selectedDiv.style.cssText = `
        background-color: #000;
        color: white;
        padding: 14px 16px;
        border: 1px solid var(--border-subtle, #333);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 4px;
        font-size: 0.875rem;
    `;

    function getFlagUrl(code) {
        return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
    }

    function updateSelectedUI() {
        const opt = select.options[select.selectedIndex];
        if (opt && opt.value) {
            const country = COUNTRIES.find(c => c.name === opt.value);
            const code = country ? country.code : 'us';
            selectedDiv.innerHTML = `
                <span>${opt.text}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${getFlagUrl(code)}" alt="${code}" style="width: 24px; border-radius: 2px;">
                    <i class="fas fa-chevron-down" style="font-size: 0.7em;"></i>
                </div>
            `;
        } else {
            selectedDiv.innerHTML = `
                <span>Select Country</span>
                <i class="fas fa-chevron-down" style="font-size: 0.7em;"></i>
            `;
        }
    }

    // Initial render
    updateSelectedUI();

    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'select-items select-hide';
    itemsDiv.style.cssText = `
        position: absolute;
        background-color: #000;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 9999;
        border: 1px solid #333;
        border-top: none;
        max-height: 250px;
        overflow-y: auto;
        display: none;
    `;

    // Add Search Box
    const searchDiv = document.createElement('div');
    searchDiv.style.cssText = `
        padding: 8px;
        position: sticky;
        top: 0;
        background: #000;
        border-bottom: 1px solid #333;
        z-index: 10;
    `;
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search...';
    searchInput.style.cssText = `
        width: 100%;
        padding: 8px;
        background: #111;
        border: 1px solid #333;
        color: white;
        font-family: var(--font-mono);
        font-size: 0.8rem;
        border-radius: 2px;
        outline: none;
    `;

    // Stop click propagation on search input to prevent closing
    searchInput.addEventListener('click', (e) => e.stopPropagation());

    // Filter logic
    searchInput.addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase();
        const items = itemsDiv.querySelectorAll('.country-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(filter)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    searchDiv.appendChild(searchInput);
    itemsDiv.appendChild(searchDiv);

    // List Items
    COUNTRIES.forEach(country => {
        const item = document.createElement('div');
        item.className = 'country-item';
        item.style.cssText = `
            padding: 10px 16px;
            cursor: pointer;
            border-bottom: 1px solid #1a1a1a;
            color: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
        `;
        item.innerHTML = `
            <span>${country.name}</span> 
            <img src="${getFlagUrl(country.code)}" width="24" style="border-radius: 2px;">
        `;

        item.addEventListener('click', () => {
            // Update native select
            select.value = country.name;
            select.dispatchEvent(new Event('change')); // Trigger change event

            updateSelectedUI();
            closeAllSelect(itemsDiv);
        });

        item.addEventListener('mouseover', () => item.style.backgroundColor = '#1a1a1a');
        item.addEventListener('mouseout', () => item.style.backgroundColor = '#000');

        itemsDiv.appendChild(item);
    });

    container.appendChild(selectedDiv);
    container.appendChild(itemsDiv);
    select.parentNode.insertBefore(container, select.nextSibling);

    // Toggle
    selectedDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = itemsDiv.style.display === 'none';
        closeAllSelect(); // Close others
        itemsDiv.style.display = isHidden ? 'block' : 'none';
        selectedDiv.style.borderColor = isHidden ? '#c5a028' : '#333';

        // Focus search if opening
        if (isHidden) {
            setTimeout(() => searchInput.focus(), 50);
        }
    });

    // Observer doesn't check value property changes easily, so we hook 'change' event
    select.addEventListener('change', updateSelectedUI);
}

function closeAllSelect(except) {
    const items = document.getElementsByClassName('select-items');
    const selected = document.getElementsByClassName('select-selected');

    for (let i = 0; i < items.length; i++) {
        if (items[i] !== except) items[i].style.display = 'none';
    }
    for (let i = 0; i < selected.length; i++) {
        selected[i].style.borderColor = '#333';
    }
}

document.addEventListener('click', closeAllSelect);
