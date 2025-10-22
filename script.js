const form = document.getElementById('booking-form');
const scheduleEl = document.getElementById('schedule');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const vehicle = document.getElementById('vehicle').value;
  const date = document.getElementById('date').value;
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;

  await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, vehicle, date, start, end })
  });

  form.reset();
  loadSchedule();
});

async function loadSchedule() {
  const res = await fetch('/api/bookings');
  const data = await res.json();
  renderSchedule(data);
}

function renderSchedule(data) {
  const today = new Date();
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  let html = `<div><strong>Time</strong></div>`;
  days.forEach(d => {
    const date = new Date(d);
    html += `<div><strong>${date.toDateString()}</strong></div>`;
  });

  const timeSlots = [];
  for (let h = 6; h < 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      timeSlots.push(slot);
    }
  }

  timeSlots.forEach(slot => {
    html += `<div>${slot}</div>`;
    days.forEach(day => {
      const b = data.find(b => b.date === day && b.start === slot);
      html += `<div>${b ? `${b.name} (${b.vehicle})` : ''}</div>`;
    });
  });

  scheduleEl.innerHTML = html;
}

loadSchedule();
