const START_HOUR = 6; 
const END_HOUR = 23.5; 
const SLOT_HEIGHT = 2.5; // Matches 2.5rem in styles.css

// Attach functions to window so onclick works in the grid
window.approveBooking = async (id) => {
    const res = await fetch(`/api/bookings/${id}/approve`, { method: 'PATCH' });
    if (res.ok) {
        fetchAdminBookings(); // Refresh the data
    } else {
        alert("Server error during approval. Check server console.");
    }
};

window.deleteBooking = async (id) => {
    if (confirm("Delete this booking permanently?")) {
        const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAdminBookings();
    }
};

async function fetchAdminBookings() {
    try {
        const res = await fetch('/api/bookings');
        const data = await res.json();
        renderAdminGrid(data);
    } catch (err) {
        console.error("Error fetching admin data:", err);
    }
}

function renderAdminGrid(bookings) {
    const wrapper = document.querySelector(".scheduleWrapper");
    if (!wrapper) return;
    wrapper.innerHTML = "";
    
    const grid = document.createElement("div");
    grid.className = "scheduleGrid";
    wrapper.appendChild(grid);

    const today = new Date();
    const dayKeys = [];

    // Header Column
    grid.appendChild(document.createElement("div")).className = "headerCell";
    for(let i=0; i<7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const key = d.toISOString().split('T')[0];
        dayKeys.push(key);
        const h = document.createElement("div");
        h.className = "headerCell";
        h.textContent = d.toLocaleDateString(undefined, {weekday:'short', day:'numeric'});
        grid.appendChild(h);
    }

    // Time Slots
    const totalSlots = (END_HOUR - START_HOUR) * 2;
    for(let i=0; i<totalSlots; i++) {
        const tLabel = document.createElement("div");
        tLabel.className = "timeLabel";
        const mins = (START_HOUR * 60) + (i * 30);
        if(mins % 60 === 0) tLabel.textContent = `${mins/60}:00`;
        grid.appendChild(tLabel);

        dayKeys.forEach(day => {
            const cell = document.createElement("div");
            cell.className = "dayCell";
            cell.dataset.day = day;
            cell.dataset.slot = i;
            grid.appendChild(cell);
        });
    }

    // Bookings
    bookings.forEach(b => {
        const dIdx = dayKeys.indexOf(b.date);
        if(dIdx === -1) return;

        const [h1, m1] = b.start.split(':').map(Number);
        const [h2, m2] = b.end.split(':').map(Number);
        const start = h1 * 60 + m1;
        const offset = start - (START_HOUR * 60);
        const duration = (h2 * 60 + m2) - start;

        const slot = document.createElement("div");
        slot.className = `bookedSlot ${b.status || 'pending'}`;
        slot.style.top = `${(offset / 30) * SLOT_HEIGHT}rem`;
        slot.style.height = `${(duration / 30) * SLOT_HEIGHT}rem`;
        
        const isApproved = b.status === 'approved';
        
        slot.innerHTML = `
            <div style="font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${b.event}
            </div>
            <div class="admin-actions">
                ${!isApproved ? `<button class="btn-approve" onclick="window.approveBooking(${b.id})">✔</button>` : `<span style="font-size:10px">✅</span>`}
                <button class="btn-delete" onclick="window.deleteBooking(${b.id})">✘</button>
            </div>
        `;
        
        const target = grid.querySelector(`.dayCell[data-day="${b.date}"][data-slot="0"]`);
        if(target) target.appendChild(slot);
    });
}

fetchAdminBookings();
