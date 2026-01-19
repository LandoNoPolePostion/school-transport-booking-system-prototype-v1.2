const API_URL = '/api/bookings';
const START_HOUR = 6; 
const END_HOUR = 23.5; 
const MINUTES_PER_SLOT = 30;
const SLOT_HEIGHT_REM = 2.5; // Matches styles.css

const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

const formatDate = (d) => d.toISOString().split('T')[0];

async function fetchBookings() {
    const res = await fetch(API_URL);
    const data = await res.json();
    buildAdminSchedule(data);
}

// ACTION: Approve
async function approveBooking(id) {
    await fetch(`${API_URL}/${id}/approve`, { method: 'PATCH' });
    fetchBookings(); // Refresh grid
}

// ACTION: Delete
async function deleteBooking(id) {
    if(confirm("Are you sure you want to delete this booking?")) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchBookings(); // Refresh grid
    }
}

function buildAdminSchedule(bookings) {
    const wrapper = document.querySelector(".scheduleWrapper");
    if (!wrapper) return;
    wrapper.innerHTML = ""; 
    
    const grid = document.createElement("div");
    grid.classList.add("scheduleGrid");
    wrapper.appendChild(grid);

    const today = new Date();
    const dayKeys = [];

    // 1. GENERATE HEADERS
    grid.appendChild(document.createElement("div")).classList.add("headerCell"); 
    for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() + d);
        const key = formatDate(date);
        dayKeys.push(key);

        const header = document.createElement("div");
        header.classList.add("headerCell");
        header.textContent = d === 0 ? "Today" : date.toLocaleDateString(undefined, {weekday:'short', day:'numeric'});
        grid.appendChild(header);
    }

    // 2. GENERATE TIME LABELS & CELLS
    const totalSlots = (END_HOUR - START_HOUR) * (60 / MINUTES_PER_SLOT);
    for (let i = 0; i < totalSlots; i++) {
        const totalMins = (START_HOUR * 60) + (i * MINUTES_PER_SLOT);
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;

        const timeLabel = document.createElement("div");
        timeLabel.classList.add("timeLabel");
        if (m === 0) timeLabel.textContent = `${h.toString().padStart(2, '0')}:00`;
        grid.appendChild(timeLabel);

        dayKeys.forEach(dayKey => {
            const dayCell = document.createElement("div");
            dayCell.classList.add("dayCell");
            dayCell.dataset.day = dayKey;
            dayCell.dataset.slot = i;
            grid.appendChild(dayCell);
        });
    }

    // 3. POSITION ADMIN BOOKINGS
    bookings.forEach(booking => {
        const dayIndex = dayKeys.indexOf(booking.date);
        if (dayIndex === -1) return;

        const startMins = timeToMinutes(booking.start);
        const endMins = timeToMinutes(booking.end);
        const offsetMins = startMins - (START_HOUR * 60);
        const durationMins = endMins - startMins;

        if (offsetMins < 0 || durationMins <= 0) return;

        const slot = document.createElement("div");
        slot.classList.add("bookedSlot", booking.status);
        
        const topRem = (offsetMins / MINUTES_PER_SLOT) * SLOT_HEIGHT_REM;
        const heightRem = (durationMins / MINUTES_PER_SLOT) * SLOT_HEIGHT_REM;
        
        slot.style.top = `${topRem}rem`;
        slot.style.height = `${heightRem}rem`;
        
        // ADMIN INTERFACE: Adding the buttons directly inside the slot
        slot.innerHTML = `
            <div style="font-weight:bold; border-bottom:1px solid rgba(0,0,0,0.1); margin-bottom:2px;">
                ${booking.start} - ${booking.end}
            </div>
            <div style="font-size: 9px;">${booking.event}</div>
            <div class="admin-actions">
                ${booking.status === 'pending' ? `<button class="btn-approve" onclick="approveBooking(${booking.id})">✔</button>` : ''}
                <button class="btn-delete" onclick="deleteBooking(${booking.id})">✘</button>
            </div>
        `;

        const target = grid.querySelector(`.dayCell[data-day="${booking.date}"][data-slot="0"]`);
        if (target) target.appendChild(slot);
    });
}

// Run on load
fetchBookings();