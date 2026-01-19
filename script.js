// script.js - Updated with Positioning Fixes and Admin Access
const API_URL = '/api/bookings';
const START_HOUR = 6; 
const END_HOUR = 23.5; 
const MINUTES_PER_SLOT = 30;
const SLOT_HEIGHT_REM = 2.5; // This MUST match the .dayCell height in styles.css

// Helper: Convert HH:MM to total minutes
const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

// Helper: Format Date to YYYY-MM-DD
const formatDate = (d) => d.toISOString().split('T')[0];

async function fetchBookings() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        buildSchedule(data);
    } catch (err) {
        console.error("Error fetching bookings:", err);
    }
}

function buildSchedule(bookings) {
    const wrapper = document.querySelector(".scheduleWrapper");
    if (!wrapper) return;
    wrapper.innerHTML = ""; // Clear existing grid
    
    const grid = document.createElement("div");
    grid.classList.add("scheduleGrid");
    wrapper.appendChild(grid);

    const today = new Date();
    const dayKeys = [];

    // 1. GENERATE HEADERS
    grid.appendChild(document.createElement("div")).classList.add("headerCell"); // Corner
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

    // 2. GENERATE TIME LABELS & EMPTY CELLS
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

    // 3. POSITION BOOKINGS
    bookings.forEach(booking => {
        const dayIndex = dayKeys.indexOf(booking.date);
        if (dayIndex === -1) return; // Skip if date is not in the 7-day view

        const startMins = timeToMinutes(booking.start);
        const endMins = timeToMinutes(booking.end);
        const scheduleStartMins = START_HOUR * 60;

        const offsetMins = startMins - scheduleStartMins;
        const durationMins = endMins - startMins;

        if (offsetMins < 0 || durationMins <= 0) return;

        // CREATE THE SLOT
        const slot = document.createElement("div");
        slot.classList.add("bookedSlot", booking.status || 'pending');
        
        // Correct Math for Positioning (Top and Height)
        const topRem = (offsetMins / MINUTES_PER_SLOT) * SLOT_HEIGHT_REM;
        const heightRem = (durationMins / MINUTES_PER_SLOT) * SLOT_HEIGHT_REM;
        
        slot.style.top = `${topRem}rem`;
        slot.style.height = `${heightRem}rem`;
        
        slot.innerHTML = `
            <strong>${booking.start} - ${booking.end}</strong><br>
            ${booking.event} <br>
            <span style="font-size: 8px;">(${booking.vehicle})</span>
        `;

        // IMPORTANT: Append to the first slot of the day to anchor the 'top' calculation
        const target = grid.querySelector(`.dayCell[data-day="${booking.date}"][data-slot="0"]`);
        if (target) target.appendChild(slot);
    });
}

// 4. FORM SUBMISSION
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const payload = {
            name: document.getElementById("name").value,
            vehicle: document.getElementById("vehicle").value,
            event: document.getElementById("event").value,
            date: document.getElementById("date").value,
            start: document.getElementById("startTime").value,
            end: document.getElementById("endTime").value
        };

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Booking submitted! Waiting for approval.");
            fetchBookings();
            bookingForm.reset();
            initializeFormDate(); // Reset date to today
        } else {
            alert("Error submitting booking.");
        }
    });
}

// 5. INITIALIZE FORM DATE
function initializeFormDate() {
    const dateInput = document.getElementById("date");
    if (dateInput) {
        const todayKey = formatDate(new Date());
        dateInput.min = todayKey;
        dateInput.value = todayKey;
    }
}

// RUN ON LOAD
initializeFormDate();
fetchBookings();


