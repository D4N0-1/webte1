const SEMESTER_START = new Date('2026-09-14T00:00:00');
const SEMESTER_END = new Date('2027-02-13T23:59:59');

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Hamburger Menu
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => navMenu.classList.toggle('is-active'));
  }

  // 2. Workspace Interactive Hotspots
  const hotspots = document.querySelectorAll('.hotspot');
  const panelTitle = document.getElementById('panelTitle');
  const panelText = document.getElementById('panelText');

  if (hotspots.length > 0 && panelTitle && panelText) {
    const updatePanel = (hotspot) => {
      panelTitle.textContent = hotspot.getAttribute('data-title');
      panelText.textContent = hotspot.getAttribute('data-text');
      hotspots.forEach(h => h.classList.remove('is-active'));
      hotspot.classList.add('is-active');
    };

    updatePanel(hotspots[0]);
    hotspots.forEach(hotspot => {
      ['mouseenter', 'focus', 'click', 'touchstart'].forEach(e => {
        hotspot.addEventListener(e, () => updatePanel(hotspot), { passive: true });
      });
    });
  }

  // 3. Timetable Schedule Functions
  if (document.getElementById('scheduleTable')) {
    initScheduleFilter();
    updateCurrentClassAndStatus();
    updateSemesterProgress();
  }

  // 4. Interactive Map Logic
  if (document.getElementById('map')) {
    initMap();
  }
});

function initScheduleFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const slots = document.querySelectorAll('.schedule-table td.slot');
  const emptyMessage = document.getElementById('filterEmptyMessage');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      let visibleCount = 0;
      slots.forEach(slot => {
        const type = slot.getAttribute('data-type');
        if (filter === 'all' || type === filter || type === 'free') {
          slot.classList.remove('dimmed');
          if (type === filter) visibleCount++;
        } else {
          slot.classList.add('dimmed');
        }
      });

      if (emptyMessage) {
        emptyMessage.style.display = (filter !== 'all' && visibleCount === 0) ? 'block' : 'none';
      }
    });
  });
}

function updateCurrentClassAndStatus() {
  const statusText = document.getElementById('statusText');
  if (!statusText) return;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayMap = { 1: 'Pondelok', 2: 'Utorok', 3: 'Streda', 4: 'Štvrtok', 5: 'Piatok' };

  let activeFound = false;
  let upcoming = [];

  document.querySelectorAll('.schedule-table td.slot[data-start]').forEach(slot => {
    const slotDay = parseInt(slot.closest('tr').getAttribute('data-day'), 10);
    const [sH, sM] = slot.getAttribute('data-start').split(':').map(Number);
    const [eH, eM] = slot.getAttribute('data-end').split(':').map(Number);
    const startTotal = sH * 60 + sM;
    const endTotal = eH * 60 + eM;

    if (slotDay === currentDay && currentMinutes >= startTotal && currentMinutes < endTotal) {
      slot.classList.add('active-now');
      activeFound = true;
      statusText.innerHTML = `Práve prebieha: <strong>${slot.getAttribute('data-name')}</strong> (${slot.getAttribute('data-start')}–${slot.getAttribute('data-end')})`;
    } else {
      slot.classList.remove('active-now');
    }

    let dayOffset = slotDay - currentDay;
    if (dayOffset < 0 || (dayOffset === 0 && startTotal <= currentMinutes)) dayOffset += 7;

    upcoming.push({
      dayName: dayMap[slotDay] || 'Pondelok',
      name: slot.getAttribute('data-name'),
      start: slot.getAttribute('data-start'),
      dist: dayOffset * 1440 + (startTotal - currentMinutes)
    });
  });

  if (!activeFound) {
    upcoming.sort((a, b) => a.dist - b.dist);
    statusText.innerHTML = upcoming.length > 0 
      ? `Výučba momentálne neprebieha. Najbližšia hodina: <strong>${upcoming[0].name}</strong> (${upcoming[0].dayName} o ${upcoming[0].start})`
      : 'Výučba momentálne neprebieha.';
  }
}

function updateSemesterProgress() {
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentage = document.getElementById('progressPercentage');
  if (!progressBarFill || !progressPercentage) return;

  const now = new Date();
  let pct = Math.max(0, Math.min(100, ((now - SEMESTER_START) / (SEMESTER_END - SEMESTER_START)) * 100)).toFixed(1);
  progressBarFill.style.width = `${pct}%`;
  progressPercentage.textContent = `${pct}%`;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function initMap() {
  const FIXED_LOCATIONS = {
    school: { name: 'FEI STU (Škola)', lat: 48.15197, lng: 17.07360 },
    home: { name: 'Internát (ŠD Mladosť)', lat: 48.15895, lng: 17.06401 }
  };

  const map = L.map('map').setView([48.165, 17.055], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> | <a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>'
  }).addTo(map);

  Object.values(FIXED_LOCATIONS).forEach(loc => {
    L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(`<b>${loc.name}</b>`);
  });

  let userMarkersGroup = L.layerGroup().addTo(map);
  let activePolyline = null;
  let userPoints = JSON.parse(localStorage.getItem('portfolio_user_points')) || [];

  const startSelect = document.getElementById('startPointSelect');
  const destSelect = document.getElementById('destinationSelect');
  const calcBtn = document.getElementById('calcRouteBtn');
  const pointsList = document.getElementById('pointsList');

  function getPointByKey(key) {
    if (key.startsWith('fixed:')) return FIXED_LOCATIONS[key.replace('fixed:', '')];
    if (key.startsWith('user:')) return userPoints[parseInt(key.replace('user:', ''), 10)];
    return null;
  }

  function render() {
    userMarkersGroup.clearLayers();
    pointsList.innerHTML = '';

    startSelect.innerHTML = '<option value="" disabled selected>-- Vyberte štartovací bod --</option>';
    destSelect.innerHTML = '<option value="" disabled selected>-- Vyberte cieľový bod --</option>';

    const appendGroup = (label, isUser = false) => {
      const gStart = document.createElement('optgroup');
      const gDest = document.createElement('optgroup');
      gStart.label = gDest.label = label;

      const items = isUser ? userPoints : Object.keys(FIXED_LOCATIONS).map(k => ({ key: `fixed:${k}`, name: FIXED_LOCATIONS[k].name }));
      items.forEach((item, idx) => {
        const val = isUser ? `user:${idx}` : item.key;
        gStart.appendChild(new Option(item.name, val));
        gDest.appendChild(new Option(item.name, val));
      });

      startSelect.appendChild(gStart);
      destSelect.appendChild(gDest);
    };

    appendGroup('Pevné miesta', false);

    if (userPoints.length > 0) {
      appendGroup('Moje pridané body', true);
      document.getElementById('emptyListText').style.display = 'none';
      document.getElementById('clearAllPointsBtn').style.display = 'block';

      userPoints.forEach((pt, idx) => {
        userMarkersGroup.addLayer(L.marker([pt.lat, pt.lng]).bindPopup(`<b>${pt.name}</b>`));
        const li = document.createElement('li');
        li.innerHTML = `<span><strong>${pt.name}</strong></span><button type="button" data-index="${idx}">✕</button>`;
        pointsList.appendChild(li);
      });
    } else {
      document.getElementById('emptyListText').style.display = 'block';
      document.getElementById('clearAllPointsBtn').style.display = 'none';
    }
  }

  function save() {
    localStorage.setItem('portfolio_user_points', JSON.stringify(userPoints));
    render();
  }

  map.on('click', (e) => {
    const name = prompt('Zadajte názov pre tento bod:');
    if (name && name.trim()) {
      userPoints.push({ name: name.trim(), lat: e.latlng.lat, lng: e.latlng.lng });
      save();
    }
  });

  pointsList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      userPoints.splice(parseInt(e.target.getAttribute('data-index'), 10), 1);
      save();
    }
  });

  document.getElementById('clearAllPointsBtn').addEventListener('click', () => {
    if (confirm('Vymazať všetky body?')) { userPoints = []; save(); }
  });

  const checkState = () => calcBtn.disabled = !(startSelect.value && destSelect.value);
  startSelect.addEventListener('change', checkState);
  destSelect.addEventListener('change', checkState);

  document.getElementById('routeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (startSelect.value === destSelect.value) return alert('Štart a cieľ nemôžu byť rovnaké!');

    const p1 = getPointByKey(startSelect.value);
    const p2 = getPointByKey(destSelect.value);
    if (!p1 || !p2) return;

    if (activePolyline) map.removeLayer(activePolyline);

    activePolyline = L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], { color: '#38bdf8', weight: 4, dashArray: '8, 8' }).addTo(map);
    map.fitBounds(activePolyline.getBounds(), { padding: [40, 40] });

    document.getElementById('routeResultText').innerHTML = `Vzdialenosť z <strong>${p1.name}</strong> do <strong>${p2.name}</strong> je <strong>${calculateHaversineDistance(p1.lat, p1.lng, p2.lat, p2.lng).toFixed(2)} km</strong>.`;
    document.getElementById('routeResultCard').style.display = 'block';
  });

  document.getElementById('clearRouteBtn').addEventListener('click', () => {
    if (activePolyline) map.removeLayer(activePolyline);
    document.getElementById('routeResultCard').style.display = 'none';
  });

  render();
}