// Lightweight availability calendar powered by assets/availability.json

document.addEventListener('DOMContentLoaded', () => {
    console.log('Availability page loaded successfully');
    const urlParams = new URLSearchParams(window.location.search);
    const postcodeFromQuery = urlParams.get('postcode') || '';
    const postcodeInput = document.getElementById('postcodeInput');
    const postcodePill = document.getElementById('postcodePill');
    const updateBtn = document.getElementById('updatePostcodeBtn');

    if (postcodeFromQuery) {
        postcodeInput.value = postcodeFromQuery.toUpperCase();
    }
    renderPostcodePill();

    updateBtn.addEventListener('click', () => {
        const pc = (postcodeInput.value || '').toUpperCase().trim();
        const params = new URLSearchParams(window.location.search);
        if (pc) params.set('postcode', pc); else params.delete('postcode');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        renderPostcodePill();
    });

    // Test button
    document.getElementById('testBtn')?.addEventListener('click', () => {
        alert('JavaScript is working!');
        console.log('Test button clicked');
    });

    function renderPostcodePill() {
        const pc = (postcodeInput.value || '').toUpperCase().trim();
        postcodePill.textContent = pc ? `Postcode: ${pc}` : '';
    }

    // Month navigation
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthDisplay = document.getElementById('currentMonthDisplay');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const today = new Date();
    
    // Start availability from December 1st, 2025
    const startDate = new Date(2025, 11, 1); // Month is 0-indexed, so 11 = December
    let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    let state = { unavailable: [] };
    let selectedDates = [];
    
    // Pricing data
    const pricing = {
        dailyRate: 70,
        deliveryRates: [
            { maxMiles: 50, price: 150 },
            { maxMiles: 100, price: 200 },
            { maxMiles: 150, price: 250 },
            { maxMiles: 200, price: 300 },
            { maxMiles: 300, price: 450 }
        ]
    };

    // Admin reveal: show only with ?admin=1 or on localhost
    const adminSection = document.getElementById('adminSection');
    const isAdmin = location.search.includes('admin=1') || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (adminSection && isAdmin) adminSection.style.display = '';

    // Load initial JSON
    fetch('assets/availability.json')
        .then(r => r.json())
        .then(data => {
            state.unavailable = Array.isArray(data.unavailable) ? data.unavailable : [];
            renderAll();
            hydrateAdmin();
            hydrateNavigation();
        })
        .catch(() => {
            state.unavailable = [];
            renderAll();
            hydrateAdmin();
            hydrateNavigation();
        });

    function renderAll() {
        calendarGrid.innerHTML = '';
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        calendarGrid.appendChild(renderMonth(currentMonth, state));
        calendarGrid.appendChild(renderMonth(nextMonth, state));
        currentMonthDisplay.textContent = `${currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })} & ${nextMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}`;
        renderRangesList();
    }

    function hydrateNavigation() {
        prevMonthBtn?.addEventListener('click', () => {
            const prevMonth = new Date(currentMonth);
            prevMonth.setMonth(prevMonth.getMonth() - 1);
            
            // Don't allow going before December 2025
            if (prevMonth >= startDate) {
                currentMonth.setMonth(currentMonth.getMonth() - 1);
                renderAll();
            }
        });
        
        nextMonthBtn?.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            renderAll();
        });
    }

    // Admin form logic
    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');
    const addRangeBtn = document.getElementById('addRangeBtn');
    const clearRangesBtn = document.getElementById('clearRangesBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const rangesList = document.getElementById('rangesList');
    const copyJsonBtn = document.getElementById('copyJsonBtn');

    function hydrateAdmin() {
        addRangeBtn?.addEventListener('click', () => {
            const s = rangeStart.value;
            const e = rangeEnd.value || s;
            if (!s) {
                alert('Pick a start date');
                return;
            }
            if (e < s) {
                alert('End date must be the same or after start');
                return;
            }
            state.unavailable.push({ start: s, end: e });
            rangeStart.value = '';
            rangeEnd.value = '';
            renderAll();
        });

        clearRangesBtn?.addEventListener('click', () => {
            if (confirm('Clear all unavailable ranges?')) {
                state.unavailable = [];
                renderAll();
            }
        });

        downloadBtn?.addEventListener('click', () => {
            const jsonStr = JSON.stringify({ unavailable: state.unavailable }, null, 2);
            try {
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'availability.json';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            } catch (e) {
                // Fallback: open in new tab
                const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
                window.open(dataUrl, '_blank');
            }
        });

        copyJsonBtn?.addEventListener('click', async () => {
            const jsonStr = JSON.stringify({ unavailable: state.unavailable }, null, 2);
            try {
                await navigator.clipboard.writeText(jsonStr);
                alert('JSON copied to clipboard');
            } catch (e) {
                // Fallback: prompt
                window.prompt('Copy JSON:', jsonStr);
            }
        });
    }

    function renderRangesList() {
        if (!rangesList) return;
        rangesList.innerHTML = '';
        state.unavailable.forEach((r, idx) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.justifyContent = 'space-between';
            li.style.border = '1px solid #e5e7eb';
            li.style.borderRadius = '0.5rem';
            li.style.padding = '0.5rem 0.75rem';
            li.innerHTML = `<span style="font-size: 0.875rem; color: #374151;">${r.start} → ${r.end}</span>`;
            const btn = document.createElement('button');
            btn.textContent = 'Remove';
            btn.className = 'btn';
            btn.style.border = '1px solid #d1d5db';
            btn.addEventListener('click', () => {
                state.unavailable.splice(idx, 1);
                renderAll();
            });
            li.appendChild(btn);
            rangesList.appendChild(li);
        });
    }
});

function renderMonth(monthStart, availability) {
    const container = document.createElement('div');
    container.className = 'calendar';

    const title = document.createElement('h3');
    title.textContent = monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    container.appendChild(title);

    const weekdayRow = document.createElement('div');
    weekdayRow.className = 'weekday-row';
    ;['Mo','Tu','We','Th','Fr','Sa','Su'].forEach(d => {
        const el = document.createElement('div');
        el.className = 'weekday';
        el.textContent = d;
        weekdayRow.appendChild(el);
    });
    container.appendChild(weekdayRow);

    const dateGrid = document.createElement('div');
    dateGrid.className = 'date-grid';

    const firstDay = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    // Compute leading blanks (Mon-based week)
    const jsDayToIso = d => (d === 0 ? 7 : d); // Sun=0 -> 7
    const lead = jsDayToIso(firstDay.getDay()) - 1;
    for (let i = 0; i < lead; i++) dateGrid.appendChild(document.createElement('div'));

    // Expand ranges into a Set of ISO date strings
    const unavailableSet = new Set();
    (availability.unavailable || []).forEach(r => {
        const start = new Date(r.start);
        const end = new Date(r.end);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            unavailableSet.add(d.toISOString().slice(0,10));
        }
    });

    const today = new Date();
    const startDateStr = startDate.toISOString().slice(0,10);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
        const iso = date.toISOString().slice(0,10);
        const cell = document.createElement('div');
        cell.className = 'date';
        const isUnavailable = unavailableSet.has(iso);
        const isPast = iso < startDateStr; // Use startDate instead of today
        cell.classList.add(isUnavailable ? 'disabled' : 'available');
        if (isPast) cell.classList.add('past-date');
        cell.textContent = String(day);
        
        // Add click handler for available dates
        if (!isUnavailable && !isPast) {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Date clicked:', iso); // Debug log
                toggleDateSelection(iso, cell);
            });
        }
        
        dateGrid.appendChild(cell);
    }

    container.appendChild(dateGrid);
    return container;
}

// Date selection and pricing functions
function toggleDateSelection(dateStr, cell) {
    console.log('toggleDateSelection called with:', dateStr); // Debug log
    const index = selectedDates.indexOf(dateStr);
    if (index > -1) {
        selectedDates.splice(index, 1);
        cell.classList.remove('selected');
        console.log('Date deselected:', dateStr);
    } else {
        selectedDates.push(dateStr);
        cell.classList.add('selected');
        console.log('Date selected:', dateStr);
    }
    selectedDates.sort();
    updatePricingCalculator();
}

function updatePricingCalculator() {
    const calculator = document.getElementById('pricingCalculator');
    const selectedDatesDiv = document.getElementById('selectedDates');
    const pricingBreakdown = document.getElementById('pricingBreakdown');
    const totalCost = document.getElementById('totalCost');
    
    if (selectedDates.length === 0) {
        calculator.style.display = 'none';
        return;
    }
    
    calculator.style.display = 'block';
    
    // Show selected dates
    const startDate = new Date(selectedDates[0]);
    const endDate = new Date(selectedDates[selectedDates.length - 1]);
    const days = selectedDates.length;
    
    selectedDatesDiv.textContent = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} (${days} day${days > 1 ? 's' : ''})`;
    
    // Calculate pricing
    const dailyCost = days * pricing.dailyRate;
    const deliveryCost = getDeliveryCost();
    
    pricingBreakdown.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <span>Daily hire (${days} day${days > 1 ? 's' : ''} × £${pricing.dailyRate})</span>
            <span>£${dailyCost}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Delivery & Collection</span>
            <span>£${deliveryCost}</span>
        </div>
    `;
    
    const total = dailyCost + deliveryCost;
    totalCost.textContent = `Total: £${total} + VAT`;
}

function getDeliveryCost() {
    const postcode = document.getElementById('postcodeInput').value.toUpperCase().trim();
    if (!postcode) return 0;
    
    // Simple distance estimation based on postcode area
    const postcodeArea = postcode.substring(0, 2);
    const distanceMap = {
        'EN': 0, 'AL': 15, 'HP': 20, 'LU': 25, 'MK': 30, 'SG': 35, 'CB': 40, 'CM': 45, 'CO': 50,
        'IP': 60, 'NR': 70, 'PE': 80, 'SS': 25, 'IG': 20, 'RM': 25, 'E': 15, 'EC': 20, 'N': 10,
        'NW': 12, 'SE': 18, 'SW': 20, 'W': 15, 'WC': 18, 'DA': 25, 'BR': 30, 'CR': 35, 'KT': 40,
        'SM': 35, 'TW': 45, 'UB': 50, 'HA': 40, 'WD': 45, 'SL': 55, 'RG': 60, 'GU': 65, 'PO': 70,
        'SO': 75, 'BH': 80, 'DT': 85, 'SP': 90, 'OX': 95, 'GL': 100, 'BA': 105, 'SN': 110, 'WR': 115,
        'CV': 120, 'B': 125, 'DY': 130, 'WS': 135, 'WV': 140, 'ST': 145, 'TF': 150, 'SY': 155, 'HR': 160,
        'LD': 165, 'NP': 170, 'CF': 175, 'SA': 180, 'LL': 185, 'CH': 190, 'L': 195, 'M': 200, 'SK': 205,
        'OL': 210, 'BL': 215, 'PR': 220, 'FY': 225, 'BB': 230, 'BD': 235, 'HD': 240, 'HX': 245, 'LS': 250,
        'S': 255, 'WF': 260, 'DN': 265, 'HU': 270, 'YO': 275, 'NE': 280, 'DH': 285, 'SR': 290, 'TS': 295,
        'DL': 300, 'HG': 305, 'LA': 310, 'CA': 315, 'TD': 320, 'EH': 325, 'FK': 330, 'G': 335, 'KA': 340,
        'KY': 345, 'ML': 350, 'PA': 355, 'PH': 360, 'AB': 365, 'DD': 370, 'IV': 375, 'KW': 380, 'ZE': 385
    };
    
    const estimatedMiles = distanceMap[postcodeArea] || 100;
    
    for (const rate of pricing.deliveryRates) {
        if (estimatedMiles <= rate.maxMiles) {
            return rate.price;
        }
    }
    
    return pricing.deliveryRates[pricing.deliveryRates.length - 1].price;
}


