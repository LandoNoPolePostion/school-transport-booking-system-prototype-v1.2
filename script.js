// script.js
const API_URL = '/api/bookings';
let allBookings = [];
const START_HOUR = 6; // 6 AM
const END_HOUR = 23.5;  // 11:30 PM
const MINUTES_PER_SLOT = 30;
const SLOTS_PER_HOUR = 60 / MINUTES_PER_SLOT;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;

// Helper function to format dates as YYYY-MM-DD
const formatDate = (d) => d.toISOString().split('T')[0];

// Helper function for header display (e.g., Mon, Jul 29)
const formatDayHeader = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

// Converts HH:MM string to total minutes from midnight
const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

async function fetchBookings() {
    const response = await fetch(API_URL);
    allBookings = await response.json();
    buildSchedule();
}

function buildSchedule() {
    const scheduleWrapper = document.querySelector(".scheduleWrapper");
    if (!scheduleWrapper) return;
    scheduleWrapper.innerHTML = "";

    const today = new Date();
    const daysToShow = 7;
    const dayKeys = [];

    // 1. Generate the next 7 days' date keys (YYYY-MM-DD)
    for (let d = 0; d < daysToShow; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() + d);
        dayKeys.push(formatDate(date));
    }

    const grid = document.createElement("div");
    grid.classList.add("scheduleGrid");
    scheduleWrapper.appendChild(grid);

    // 2. Create Headers (Time axis header + 7 day headers)
    grid.appendChild(document.createElement("div")).classList.add("headerCell"); // Empty top-left corner

    dayKeys.forEach((dayKey, index) => {
        const header = document.createElement("div");
        header.classList.add("headerCell");
        const dayTitle = (index === 0) ? "Today" : formatDayHeader(new Date(dayKey));
        header.textContent = dayTitle;
        grid.appendChild(header);
    });

    // 3. Create Time Axis and Day Cells
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        const totalMinutes = START_HOUR * 60 + i * MINUTES_PER_SLOT;
        const hour = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeText = `${hour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        const timeLabelCell = document.createElement("div");
        timeLabelCell.classList.add("timeLabel");
        if (mins === 0) { timeLabelCell.textContent = timeText; }
        grid.appendChild(timeLabelCell);

        dayKeys.forEach(dayKey => {
            const dayCell = document.createElement("div");
            dayCell.classList.add("dayCell");
            dayCell.dataset.day = dayKey;
            dayCell.dataset.slot = i;
            grid.appendChild(dayCell);
        });
    }

    // 4. Place Bookings within the grid
    allBookings.forEach(booking => {
        const dayIndex = dayKeys.indexOf(booking.date);
        if (dayIndex === -1) return;

        const bookingStartMins = timeToMinutes(booking.start);
        const bookingEndMins = timeToMinutes(booking.end);
        const scheduleStartMins = START_HOUR * 60;

        const offsetMins = bookingStartMins - scheduleStartMins;
        const durationMins = bookingEndMins - bookingStartMins;

        if (offsetMins < 0 || durationMins <= 0) return;

        const topEm = (offsetMins / MINUTES_PER_SLOT) * 2;
        const heightEm = (durationMins / MINUTES_PER_SLOT) * 2;

        const bookingSlot = document.createElement("div");
        bookingSlot.classList.add("bookedSlot");
        bookingSlot.style.top = `${topEm}em`;
        bookingSlot.style.height = `${heightEm}em`;

        bookingSlot.innerHTML = `
            <strong>${booking.start} - ${booking.end}</strong><br>
            ${booking.event} (${booking.vehicle})
        `;

        const targetCell = grid.querySelector(`.dayCell[data-day="${booking.date}"][data-slot="${Math.floor(offsetMins / MINUTES_PER_SLOT)}"]`);

        if (targetCell) { targetCell.appendChild(bookingSlot); }
    });
}

// Handle form submission
document.getElementById("bookingForm").addEventListener("submit", async e => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const vehicle = document.getElementById("vehicle").value;
    const event = document.getElementById("event").value;
    const date = document.getElementById("date").value;
    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, vehicle, event, date, start, end })
    });

    if (response.ok) {
        await fetchBookings();
        e.target.reset();
    } else {
        alert("Failed to book the trip.");
    }
});

// Initialize form date input to today's date and fetch bookings
function initializeFormDate() {
    const todayKey = formatDate(new Date());
    document.getElementById("date").min = todayKey;
    document.getElementById("date").value = todayKey;
}

// Draw schedule on page load
initializeFormDate();
fetchBookings();

// Draw schedule on page load
initializeFormDate();
fetchBookings();

