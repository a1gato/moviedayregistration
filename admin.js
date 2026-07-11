// ============================================================
//  ADMIN PANEL — JAVASCRIPT
// ============================================================

const ADMIN_PASSWORD = 'movieday2026'; // ← Change this!
const BLOCKS = [
  // Row 1 of blocks
  [
    { id: 'L1', name: 'BLOCK L1', rows: 2, cols: 3, vip: false },
    { id: 'L2', name: 'BLOCK L2 · VIP', rows: 2, cols: 3, vip: true },
    { id: 'C1', name: 'BLOCK C1 · VIP', rows: 2, cols: 5, vip: true },
    { id: 'C2', name: 'BLOCK C2 · VIP', rows: 2, cols: 5, vip: true },
    { id: 'R1', name: 'BLOCK R1 · VIP', rows: 2, cols: 3, vip: true },
    { id: 'R2', name: 'BLOCK R2', rows: 2, cols: 3, vip: false }
  ],
  // Row 2 of blocks
  [
    { id: 'L3', name: 'BLOCK L3', rows: 4, cols: 3, vip: false },
    { id: 'L4', name: 'BLOCK L4', rows: 4, cols: 3, vip: false },
    { id: 'C3', name: 'BLOCK C3', rows: 4, cols: 5, vip: false },
    { id: 'C4', name: 'BLOCK C4', rows: 4, cols: 5, vip: false },
    { id: 'R3', name: 'BLOCK R3', rows: 4, cols: 3, vip: false },
    { id: 'R4', name: 'BLOCK R4', rows: 4, cols: 3, vip: false }
  ],
  // Row 3 of blocks
  [
    { id: 'L5', name: 'BLOCK L5', rows: 2, cols: 3, vip: false },
    { id: 'L6', name: 'BLOCK L6', rows: 2, cols: 3, vip: false },
    { id: 'C5', name: 'BLOCK C5', rows: 3, cols: 5, vip: false },
    { id: 'C6', name: 'BLOCK C6', rows: 3, cols: 5, vip: false },
    { id: 'R5', name: 'BLOCK R5', rows: 2, cols: 3, vip: false },
    { id: 'R6', name: 'BLOCK R6', rows: 2, cols: 3, vip: false }
  ]
];
const TOTAL_SEATS = 186;

// Build global seat number map (1–186) across all blocks in order
const SEAT_NUMBERS = {};
(function buildSeatNumbers() {
  let counter = 1;
  BLOCKS.forEach(blockRow => {
    blockRow.forEach(block => {
      for (let r = 1; r <= block.rows; r++) {
        for (let c = 1; c <= block.cols; c++) {
          SEAT_NUMBERS[`${block.id}-${r}-${c}`] = counter++;
        }
      }
    });
  });
})();

function formatSeatForDisplay(seatId) {
  if (!seatId) return '—';
  const num = SEAT_NUMBERS[seatId];
  if (num !== undefined) return `Seat #${num}`;
  const parts = seatId.split('-');
  if (parts.length < 3) return seatId;
  const [blockId, row, col] = parts;
  return `${blockId} - R${row} - S${col}`;
}
const REGISTRATION_URL = window.location.origin + window.location.pathname.replace('admin.html','') + 'index.html';

let allData = [];
let filteredData = [];
let currentBranchFilter = 'all';
let currentTicketReg = null;

// ── LOGIN ─────────────────────────────────────────────────────
function checkLogin() {
  const pass = document.getElementById('adminPass').value;
  if (pass === ADMIN_PASSWORD) {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminApp').style.display = 'flex';
    init();
  } else {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('adminPass').value = '';
  }
}

function logout() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('adminApp').style.display = 'none';
  document.getElementById('adminPass').value = '';
  document.getElementById('loginError').style.display = 'none';
}

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  await loadRegistrations();
  generateQR();
  // Realtime updates
  sb.channel('admin_watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'movie_registrations' }, () => {
      loadRegistrations();
    })
    .subscribe();
}

// ── LOAD DATA ─────────────────────────────────────────────────
async function loadRegistrations() {
  const { data, error } = await sb
    .from('movie_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load data: ' + error.message, 'error');
    return;
  }

  allData = data || [];
  applyFilters();
  renderQuickStats();
  renderAdminSeatMap();
  renderStats();
}

// ── FILTERS ───────────────────────────────────────────────────
function filterBranch(branch, el) {
  currentBranchFilter = branch;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  applyFilters();
}

function filterTable() {
  applyFilters();
}

function applyFilters() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  filteredData = allData.filter(r => {
    const matchBranch = currentBranchFilter === 'all'
      || (currentBranchFilter === 'other' && r.branch !== 'Fast Education' && r.branch !== 'Oxford International School')
      || r.branch === currentBranchFilter;

    const matchSearch = !search
      || (r.first_name + ' ' + r.last_name).toLowerCase().includes(search)
      || (r.phone || '').includes(search)
      || (r.ticket_id || '').toLowerCase().includes(search);

    return matchBranch && matchSearch;
  });
  renderTable();
  renderTicketsList();
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── RENDER TABLE ──────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('regBody');
  if (!filteredData.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#64748b;padding:40px;">No registrations found.</td></tr>';
    return;
  }

  tbody.innerHTML = filteredData.map((r, i) => {
    const branchClass = r.branch === 'Fast Education' ? 'badge-fast'
      : r.branch === 'Oxford International School' ? 'badge-oxford' : 'badge-other';
    const date = r.created_at ? new Date(r.created_at).toLocaleString() : '—';
    const seat = r.seat ? `<span class="badge badge-seat">${escapeHTML(formatSeatForDisplay(r.seat))}</span>` : '<span style="color:#4a5568">—</span>';

    return `<tr>
      <td style="color:#4a5568;font-size:0.8rem;">${i+1}</td>
      <td><strong>${escapeHTML(r.first_name)} ${escapeHTML(r.last_name)}</strong></td>
      <td>${escapeHTML(r.phone) || '—'}</td>
      <td><span style="color:#94a3b8">${escapeHTML(r.english_level) || '—'}</span></td>
      <td><span class="badge ${branchClass}">${escapeHTML(r.branch) || '—'}</span></td>
      <td>${seat}</td>
      <td style="font-family:monospace;font-size:0.8rem;color:#fb923c">${escapeHTML(r.ticket_id) || '—'}</td>
      <td style="color:#64748b;font-size:0.8rem;">${escapeHTML(date)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-xs" onclick="openTicketModal(${i})" style="display:inline-flex;align-items:center;gap:4px;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Ticket
          </button>
          <button class="btn-xs danger" onclick="deleteReg('${r.id}')" style="display:inline-flex;align-items:center;justify-content:center;padding:4px 7px;" title="Delete">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── QUICK STATS ───────────────────────────────────────────────
function renderQuickStats() {
  const total  = allData.length;
  const seated = allData.filter(r => r.seat).length;
  const fast   = allData.filter(r => r.branch === 'Fast Education').length;
  const oxford = allData.filter(r => r.branch === 'Oxford International School').length;
  const totalSeats = TOTAL_SEATS;

  document.getElementById('quickStats').innerHTML = `
    <div class="stat-row accent">
      <span class="stat-lbl">Total Registered</span>
      <span class="stat-val">${total}</span>
    </div>
    <div class="stat-row">
      <span class="stat-lbl">Seats Taken</span>
      <span class="stat-val">${seated} / ${totalSeats}</span>
    </div>
    <div class="stat-row">
      <span class="stat-lbl">Fast Education</span>
      <span class="stat-val">${fast}</span>
    </div>
    <div class="stat-row">
      <span class="stat-lbl">Oxford Int'l</span>
      <span class="stat-val">${oxford}</span>
    </div>
  `;
}

// ── ADMIN SEAT MAP ────────────────────────────────────────────
function renderAdminSeatMap() {
  const map = document.getElementById('adminSeatMap');
  if (!map) return;
  const taken = new Set(allData.filter(r => r.seat).map(r => r.seat));

  map.innerHTML = '';
  
  BLOCKS.forEach(blockRow => {
    const rowEl = document.createElement('div');
    rowEl.className = 'block-row';

    // Left group
    const leftGroup = document.createElement('div');
    leftGroup.className = 'block-group left-group';
    leftGroup.appendChild(createAdminBlockEl(blockRow[0], taken));
    leftGroup.appendChild(createAdminBlockEl(blockRow[1], taken));

    // Center group
    const centerGroup = document.createElement('div');
    centerGroup.className = 'block-group center-group';
    centerGroup.appendChild(createAdminBlockEl(blockRow[2], taken));
    centerGroup.appendChild(createAdminBlockEl(blockRow[3], taken));

    // Right group
    const rightGroup = document.createElement('div');
    rightGroup.className = 'block-group right-group';
    rightGroup.appendChild(createAdminBlockEl(blockRow[4], taken));
    rightGroup.appendChild(createAdminBlockEl(blockRow[5], taken));

    rowEl.appendChild(leftGroup);
    rowEl.appendChild(centerGroup);
    rowEl.appendChild(rightGroup);

    map.appendChild(rowEl);
  });

  document.getElementById('seatSummary').textContent =
    `${taken.size} of ${TOTAL_SEATS} seats taken (${TOTAL_SEATS - taken.size} available)`;
}

function createAdminBlockEl(block, taken) {
  const blockEl = document.createElement('div');
  blockEl.className = 'seat-block' + (block.vip ? ' vip' : '');
  
  const titleEl = document.createElement('div');
  titleEl.className = 'block-title';
  titleEl.textContent = block.name;
  blockEl.appendChild(titleEl);

  // Hide col headers — seats now show global numbers
  const colHeadersEl = document.createElement('div');
  colHeadersEl.className = 'block-col-headers';
  colHeadersEl.style.display = 'none';
  blockEl.appendChild(colHeadersEl);

  const rowsEl = document.createElement('div');
  rowsEl.className = 'block-rows-container';

  for (let r = 1; r <= block.rows; r++) {
    const rowLine = document.createElement('div');
    rowLine.className = 'block-row-item';

    // Hide row label — seats now show global numbers
    const rowLabel = document.createElement('div');
    rowLabel.className = 'block-row-label';
    rowLabel.style.display = 'none';
    rowLine.appendChild(rowLabel);

    for (let c = 1; c <= block.cols; c++) {
      const id = `${block.id}-${r}-${c}`;
      const globalNum = SEAT_NUMBERS[id];
      const seat = document.createElement('div');
      seat.className = 'seat' + (block.vip ? ' vip' : ' regular');
      seat.textContent = globalNum;

      const seatLabel = `Seat #${globalNum}`;

      if (taken.has(id)) {
        seat.classList.add('taken');
        const attendee = allData.find(reg => reg.seat === id);
        if (attendee) {
          seat.title = `${seatLabel} — Booked by ${attendee.first_name} ${attendee.last_name} (${attendee.ticket_id})`;
          seat.addEventListener('click', () => showTicketModalFor(attendee));
        } else {
          seat.title = `${seatLabel} (Taken)`;
        }
      } else {
        seat.title = `${seatLabel} (Available)`;
      }
      rowLine.appendChild(seat);
    }
    rowsEl.appendChild(rowLine);
  }
  blockEl.appendChild(rowsEl);

  return blockEl;
}

// ── STATS CARDS ───────────────────────────────────────────────
function renderStats() {
  const container = document.getElementById('statsCards');
  const containerSec = document.getElementById('statsCardsSecondary');

  // Branch breakdown
  const branchCounts = {};
  allData.forEach(r => { branchCounts[r.branch] = (branchCounts[r.branch] || 0) + 1; });
  const maxBranch = Math.max(...Object.values(branchCounts), 1);

  // Level breakdown
  const levelCounts = {};
  allData.forEach(r => { levelCounts[r.english_level] = (levelCounts[r.english_level] || 0) + 1; });
  const maxLevel = Math.max(...Object.values(levelCounts), 1);

  const mkBars = (counts, max) => Object.entries(counts).map(([name, cnt]) => `
    <div class="chart-group">
      <div class="chart-label-row">
        <span class="chart-name">${name || '—'}</span>
        <span class="chart-count">${cnt}</span>
      </div>
      <div class="chart-track"><div class="chart-fill" style="width:${(cnt/max)*100}%"></div></div>
    </div>
  `).join('');

  const sideHtml = `
    <p class="stats-heading">BY BRANCH</p>
    ${mkBars(branchCounts, maxBranch) || '<p style="color:rgba(255,255,255,0.25);font-size:0.8rem">No data yet.</p>'}
    <p class="chart-section-label">By English Level</p>
    ${mkBars(levelCounts, maxLevel) || '<p style="color:rgba(255,255,255,0.25);font-size:0.8rem">No data yet.</p>'}
  `;

  const fullHtml = `
    <div class="stats-big-card">
      <h3>By Branch</h3>
      ${mkBars(branchCounts, maxBranch) || '<p style="color:rgba(255,255,255,0.25);font-size:0.8rem">No data yet.</p>'}
    </div>
    <div class="stats-big-card">
      <h3>By English Level</h3>
      ${mkBars(levelCounts, maxLevel) || '<p style="color:rgba(255,255,255,0.25);font-size:0.8rem">No data yet.</p>'}
    </div>
  `;

  if (container) container.innerHTML = sideHtml;
  if (containerSec) containerSec.innerHTML = fullHtml;
}

// ── QR CODE ───────────────────────────────────────────────────
function generateQR() {
  const container = document.getElementById('qrCanvas');
  if (!container || container.innerHTML.trim()) return;
  const url = window.location.href.replace('admin.html','index.html');
  document.getElementById('qrUrl').textContent = url;

  new QRCode(container, {
    text: url,
    width: 200, height: 200,
    colorDark: '#ea580c',
    colorLight: '#0a0b14',
    correctLevel: QRCode.CorrectLevel.H
  });

  // Share links
  document.getElementById('shareLinks').innerHTML = `
    <a class="share-link" href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('🎬 Movie Day 2026 — Register now and pick your seat!')}" target="_blank">
      <span class="share-link-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </span> Share on Telegram
    </a>
    <a class="share-link" href="#" onclick="copyLink('${url}');return false;">
      <span class="share-link-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      </span> Copy Link
    </a>
    <div class="share-link" style="cursor:default;">
      <span class="share-link-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      </span>
      <span>For Instagram: save the QR image & post it</span>
    </div>
  `;
}

function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => showToast('Link copied!', 'success'));
}

function downloadQR() {
  const canvas = document.querySelector('#qrCanvas canvas');
  if (!canvas) { showToast('QR not generated yet.', 'error'); return; }
  const link = document.createElement('a');
  link.download = 'MovieDay2026-QR.png';
  link.href = canvas.toDataURL();
  link.click();
}// ── TICKET MODAL ──────────────────────────────────────────────
function openTicketModal(index) {
  const r = filteredData[index];
  if (!r) return;
  showTicketModalFor(r);
}

function showTicketModalFor(r) {
  currentTicketReg = r;
  const seat = r.seat ? formatSeatForDisplay(r.seat) : '—';
  const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : '—';

  document.getElementById('printTicketContent').innerHTML = `
    <div class="print-ticket">
      <div class="pt-title">MOVIE DAY</div>
      <div class="pt-sub">2026 SPECIAL EVENT — ADMIT ONE</div>
      <hr class="pt-divider"/>
      <div class="pt-grid">
        <div class="pt-item"><div class="pt-label">First Name</div><div class="pt-value">${escapeHTML(r.first_name)}</div></div>
        <div class="pt-item"><div class="pt-label">Last Name</div><div class="pt-value">${escapeHTML(r.last_name)}</div></div>
        <div class="pt-item"><div class="pt-label">Phone</div><div class="pt-value">${escapeHTML(r.phone) || '—'}</div></div>
        <div class="pt-item"><div class="pt-label">English Level</div><div class="pt-value">${escapeHTML(r.english_level) || '—'}</div></div>
        <div class="pt-item"><div class="pt-label">Branch</div><div class="pt-value">${escapeHTML(r.branch)}</div></div>
        <div class="pt-item"><div class="pt-label">Seat</div><div class="pt-value">${escapeHTML(seat)}</div></div>
        <div class="pt-item"><div class="pt-label">Date</div><div class="pt-value">Saturday, July 11, 2026</div></div>
        <div class="pt-item"><div class="pt-label">Registered</div><div class="pt-value">${escapeHTML(date)}</div></div>
      </div>
      <hr class="pt-divider"/>
      <div class="pt-id">Ticket ID: <span>${escapeHTML(r.ticket_id) || '—'}</span></div>
    </div>
  `;

  document.getElementById('printModal').classList.remove('hidden');
}

function closePrintModal() {
  document.getElementById('printModal').classList.add('hidden');
}

function printCurrentTicket() {
  window.print();
}

function downloadCurrentTicket() {
  if (!currentTicketReg) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [148, 105] });
  const r = currentTicketReg;
  const w = 148, h = 105;

  doc.setFillColor(10, 11, 20); doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(124, 58, 237); doc.rect(0, 0, 6, h, 'F');
  doc.setFillColor(245, 158, 11); doc.rect(w - 6, 0, 6, h, 'F');
  doc.setDrawColor(80, 80, 100); doc.setLineWidth(0.3);
  for (let y = 4; y < h; y += 4) doc.line(w - 38, y, w - 38, y + 2);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(168, 85, 247);
  doc.text('MOVIE DAY', 10, 18);
  doc.setFontSize(10); doc.setTextColor(148, 163, 184);
  doc.text('2026 SPECIAL EVENT', 10, 25);
  doc.setDrawColor(124, 58, 237); doc.setLineWidth(0.5); doc.line(10, 28, 100, 28);

  const details = [
    ['ATTENDEE', r.first_name + ' ' + r.last_name],
    ['PHONE', r.phone || '—'],
    ['BRANCH', r.branch],
    ['LEVEL', r.english_level || '—'],
    ['SEAT', r.seat ? formatSeatForDisplay(r.seat) : '—'],
    ['DATE', 'Saturday, July 11, 2026'],
  ];
  let y = 38;
  details.forEach(([label, val]) => {
    doc.setFontSize(7); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold');
    doc.text(label, 10, y);
    doc.setFontSize(10); doc.setTextColor(241, 245, 249); doc.setFont('helvetica', 'normal');
    doc.text(String(val), 10, y + 5); y += 13;
  });

  doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold');
  doc.text('TICKET ID', 10, h - 10);
  doc.setTextColor(168, 85, 247); doc.text(r.ticket_id || '—', 40, h - 10);
  doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold');
  doc.text('MOVIE DAY', w - 32, 20, { align: 'center' });
  doc.text('2026', w - 32, 27, { align: 'center' });
  doc.setFontSize(7); doc.setTextColor(241, 245, 249);
  doc.text(r.seat ? formatSeatForDisplay(r.seat) : '—', w - 32, 55, { align: 'center' });
  doc.setFontSize(6); doc.setTextColor(100, 116, 139);
  doc.text('SEAT', w - 32, 60, { align: 'center' });
  doc.text('ADMIT ONE', w - 32, h - 12, { align: 'center' });

  doc.save('Ticket-' + (r.ticket_id || r.id) + '.pdf');
}
// ── DELETE ────────────────────────────────────────────────────
async function deleteReg(id) {
  if (!confirm('Delete this registration? This will also free up their seat.')) return;
  const { error } = await sb.from('movie_registrations').delete().eq('id', id);
  if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
  showToast('Registration deleted.', 'success');
  await loadRegistrations();
}

// ── TICKETS LIST & PRINT ALL ──────────────────────────────────
function renderTicketsList() {
  const container = document.getElementById('ticketsGrid');
  if (!container) return;

  if (!filteredData.length) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: rgba(255, 255, 255, 0.25); padding: 48px 16px;">No tickets to display. Fill out the search or check filters.</div>';
    return;
  }

  container.innerHTML = filteredData.map((r) => {
    const isVip = BLOCKS.flat().find(b => b.id === (r.seat || '').split('-')[0])?.vip || false;
    const seat = r.seat ? formatSeatForDisplay(r.seat) : '—';
    const vipClass = isVip ? 'vip-ticket' : '';
    const vipBadge = isVip ? '<span class="ticket-type">VIP Ticket</span>' : '<span class="ticket-type">Regular Ticket</span>';
    const rawIndex = allData.indexOf(r);

    return `
      <div class="ticket-card ${vipClass}">
        <div class="ticket-header">
          <span class="ticket-brand">MOVIE DAY</span>
          ${vipBadge}
        </div>
        <div class="ticket-body-grid">
          <div class="ticket-field">
            <span class="ticket-label">Name</span>
            <span class="ticket-value">${escapeHTML(r.first_name)} ${escapeHTML(r.last_name)}</span>
          </div>
          <div class="ticket-field">
            <span class="ticket-label">Seat</span>
            <span class="ticket-value" style="font-family: monospace; color: #fb923c;">${escapeHTML(seat)}</span>
          </div>
          <div class="ticket-field">
            <span class="ticket-label">Phone</span>
            <span class="ticket-value">${escapeHTML(r.phone) || '—'}</span>
          </div>
          <div class="ticket-field">
            <span class="ticket-label">Branch</span>
            <span class="ticket-value">${escapeHTML(r.branch)}</span>
          </div>
          <div class="ticket-field">
            <span class="ticket-label">English Level</span>
            <span class="ticket-value">${escapeHTML(r.english_level) || '—'}</span>
          </div>
          <div class="ticket-field">
            <span class="ticket-label">Date</span>
            <span class="ticket-value">July 11, 2026</span>
          </div>
        </div>
        <div class="ticket-footer">
          <span class="ticket-id-text">ID: <span>${escapeHTML(r.ticket_id) || '—'}</span></span>
          <div style="display: flex; gap: 6px;">
            <button class="btn-xs" onclick="printSingleCustomTicket(${rawIndex})">Print Custom Ticket</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function downloadCurrentTicketDirectly(index) {
  const r = allData[index];
  if (!r) return;
  currentTicketReg = r;
  downloadCurrentTicket();
}

async function generateAndDownloadCustomPDF(ticketsToPrint) {
  if (typeof html2canvas === 'undefined') {
    showToast('Error: html2canvas not loaded. Check internet connection.', 'error');
    return;
  }

  const total = ticketsToPrint.length;
  const overlay     = document.getElementById('pdfOverlay');
  const progressBar = document.getElementById('pdfProgressBar');
  const progressTxt = document.getElementById('pdfProgressText');
  const setProgress = (done, label) => {
    const pct = Math.round((done / total) * 100);
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressTxt) progressTxt.textContent = label || `${done} of ${total} tickets…`;
  };
  if (overlay) { overlay.style.display = 'flex'; setProgress(0, 'Rendering template…'); }

  const yield_ = () => new Promise(res => requestAnimationFrame(res));

  const { jsPDF } = window.jspdf;
  const A4_WIDTH_PT  = 595.28;
  const A4_HEIGHT_PT = 841.89;
  const GAP_PT = 4;
  const W = currentDesign.canvasWidth;
  const H = currentDesign.canvasHeight;
  const SCALE = 2;
  const ticketHeightPt = (H / W) * A4_WIDTH_PT;
  const ticketsPerPage = Math.max(1, Math.floor((A4_HEIGHT_PT + GAP_PT) / (ticketHeightPt + GAP_PT)));
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // Wait for fonts once upfront (ensures Roboto Cyrillic is ready for Canvas API)
  await document.fonts.ready;

  // Placeholders that change per-ticket
  const TOKENS = ['{first_name}','{last_name}','{phone}','{branch}','{level}','{seat}','{block}','{row}','{seat_num}','{ticket_id}'];
  const isDynamic = el => (!el.type || el.type === 'text') && TOKENS.some(t => (el.text||'').includes(t));

  function resolveText(text, r) {
    const seat = r.seat || '';
    const parts = seat.split('-');
    return text
      .replace('{first_name}', r.first_name || '')
      .replace('{last_name}',  r.last_name  || '')
      .replace('{phone}',      r.phone      || '')
      .replace('{branch}',     r.branch     || '')
      .replace('{level}',      r.english_level || '')
      .replace('{seat}',       seat ? formatSeatForDisplay(seat) : '—')
      .replace('{block}',      parts[0] || '—')
      .replace('{row}',        parts[1] || '—')
      .replace('{seat_num}',   seat ? String(SEAT_NUMBERS[seat] || '—') : '—')
      .replace('{ticket_id}',  r.ticket_id || '');
  }

  // ── STEP 1: Render background + static elements ONCE via html2canvas ──────────
  let baseCanvas;
  try {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `position:fixed;top:0;left:0;z-index:-9999;opacity:0;pointer-events:none;overflow:hidden;width:${W}px;height:${H}px;`;
    const container = document.createElement('div');
    container.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#1a202c;`;

    if (currentDesign.bgImage) {
      const bg = document.createElement('img');
      bg.src = currentDesign.bgImage; bg.crossOrigin = 'anonymous';
      bg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;';
      container.appendChild(bg);
    }

    // Add only STATIC elements (shapes, images, non-placeholder text)
    currentDesign.elements.filter(el => !isDynamic(el)).forEach(el => {
      const div = document.createElement('div');
      div.style.cssText   = 'position:absolute;';
      div.style.left      = el.x + 'px';
      div.style.top       = el.y + 'px';
      div.style.opacity   = el.opacity !== undefined ? (el.opacity / 100) : 1;
      div.style.transform = `rotate(${el.rotate || 0}deg)`;

      if (!el.type || el.type === 'text') {
        div.textContent      = el.text || '';
        div.style.fontSize   = (el.size || 16) + 'px';
        div.style.color      = el.color || '#fff';
        div.style.fontWeight = el.fontWeight || 'bold';
        div.style.whiteSpace = 'nowrap';
        div.style.lineHeight = '1.1';
        let ff = '"Roboto","Helvetica Neue",Arial,sans-serif';
        if (el.font === 'Anton' || el.font === 'anton') ff = '"Anton",sans-serif';
        div.style.fontFamily = ff;
      } else if (el.type === 'rect') {
        div.style.width = (el.w||100)+'px'; div.style.height = (el.h||50)+'px';
        div.style.background = el.color||'#fff';
        div.style.border = `${el.borderWidth||0}px ${el.borderStyle||'solid'} ${el.borderColor||'#000'}`;
      } else if (el.type === 'circle') {
        const d = (el.r||40)*2;
        div.style.width = d+'px'; div.style.height = d+'px';
        div.style.borderRadius = '50%';
        div.style.background = el.color||'#fff';
        div.style.border = `${el.borderWidth||0}px ${el.borderStyle||'solid'} ${el.borderColor||'#000'}`;
      } else if (el.type === 'triangle') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('width', el.w||60); svg.setAttribute('height', el.h||60);
        const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
        poly.setAttribute('points',`${(el.w||60)/2},0 0,${el.h||60} ${el.w||60},${el.h||60}`);
        poly.setAttribute('fill', el.color||'#fff');
        svg.appendChild(poly); div.appendChild(svg);
      } else if (el.type === 'image') {
        const img = document.createElement('img');
        img.src = el.url; img.crossOrigin = 'anonymous';
        img.style.cssText = `width:${el.w||100}px;height:${el.h||100}px;object-fit:contain;`;
        div.appendChild(img);
      }
      container.appendChild(div);
    });

    wrapper.appendChild(container);
    document.body.appendChild(wrapper);
    await new Promise(res => setTimeout(res, 120)); // wait for images

    baseCanvas = await html2canvas(container, {
      width: W, height: H, scale: SCALE,
      useCORS: true, allowTaint: true,
      backgroundColor: currentDesign.bgImage ? null : '#1a202c',
      logging: false
    });
    document.body.removeChild(wrapper);
  } catch(err) {
    if (overlay) overlay.style.display = 'none';
    showToast('Failed to render ticket template.', 'error');
    console.error(err);
    return;
  }

  // ── STEP 2: Per ticket — clone base canvas + draw dynamic text with Canvas 2D ─
  // Canvas 2D uses browser-loaded fonts, so Cyrillic works perfectly here.
  const dynamicEls = currentDesign.elements.filter(isDynamic);

  function renderTicketFast(r) {
    const canvas = document.createElement('canvas');
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d');

    // Copy the pre-rendered base
    ctx.drawImage(baseCanvas, 0, 0);

    // Draw each dynamic text element
    dynamicEls.forEach(el => {
      const text  = resolveText(el.text || '', r);
      const x     = parseInt(el.x) * SCALE;
      const y     = parseInt(el.y) * SCALE;
      const size  = (parseInt(el.size) || 16) * SCALE;
      const alpha = el.opacity !== undefined ? el.opacity / 100 : 1;
      const angle = (parseInt(el.rotate) || 0) * Math.PI / 180;

      let family = '"Roboto","Helvetica Neue",Arial,sans-serif';
      if (el.font === 'Anton' || el.font === 'anton') family = '"Anton",sans-serif';
      if (el.font === 'times')   family = '"Times New Roman",Times,serif';
      if (el.font === 'courier') family = '"Courier New",Courier,monospace';

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font        = `${el.fontWeight || 'bold'} ${size}px ${family}`;
      ctx.fillStyle   = el.color || '#ffffff';
      ctx.textBaseline = 'top';

      if (angle) {
        // Rotate around the text origin
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(text, 0, 0);
      } else {
        ctx.fillText(text, x, y);
      }
      ctx.restore();
    });

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // ── STEP 3: Assemble all tickets into the PDF ────────────────────────────────
  let success = 0;
  try {
    for (let i = 0; i < total; i++) {
      const r = ticketsToPrint[i];
      if (i > 0 && i % ticketsPerPage === 0) doc.addPage();

      const posOnPage = i % ticketsPerPage;
      const yPt = posOnPage * (ticketHeightPt + GAP_PT);

      if (posOnPage > 0) {
        doc.setDrawColor(160,160,160); doc.setLineWidth(0.5);
        doc.setLineDash([8,4],0);
        doc.line(0, yPt - GAP_PT/2, A4_WIDTH_PT, yPt - GAP_PT/2);
        doc.setLineDash([],0);
      }

      try {
        const imgData = renderTicketFast(r); // synchronous — instant!
        doc.addImage(imgData, 'JPEG', 0, yPt, A4_WIDTH_PT, ticketHeightPt, undefined, 'FAST');
        success++;
        setProgress(success);
      } catch(err) {
        console.error('Ticket render failed:', r.ticket_id, err);
      }

      // Yield every 10 tickets so the progress bar can update
      if (i % 10 === 0) await yield_();
    }

    if (success === 0) {
      showToast('PDF generation failed. Check browser console for errors.', 'error');
      return;
    }
    doc.save(total === 1 ? 'Custom_Ticket.pdf' : 'All_Custom_Tickets.pdf');
    showToast(`Done! ${success}/${total} tickets generated.`, 'success');
  } finally {
    if (overlay) overlay.style.display = 'none';
  }
}


function printAllTickets() {
  if (!filteredData.length) {
    showToast('No tickets to print.', 'error');
    return;
  }
  generateAndDownloadCustomPDF(filteredData);
}

function printSingleCustomTicket(index) {
  let r = allData[index];
  if (!r) {
    // Provide dummy data so Test Print works even if no one is registered yet!
    r = {
      first_name: "Александр",
      last_name: "Иванов",
      phone: "+998 90 123 45 67",
      branch: "Fast Education",
      english_level: "Advanced",
      seat: "C3-2-3",
      ticket_id: "TKT-TEST-001"
    };
  }
  generateAndDownloadCustomPDF([r]);
}

// ── EXPORT CSV ────────────────────────────────────────────────
function exportCSV() {
  if (!allData.length) { showToast('No data to export.', 'info'); return; }
  const cols = ['ticket_id','first_name','last_name','phone','english_level','branch','seat','created_at'];
  const rows = [cols.join(','), ...allData.map(r =>
    cols.map(c => '"' + String(r[c] || '').replace(/"/g,'""') + '"').join(',')
  )];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'MovieDay2026-Registrations.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── TAB NAVIGATION ────────────────────────────────────────────
function showTab(name, el) {
  document.querySelectorAll('.tab-pane').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
  const pane = document.getElementById('tab-' + name);
  if (pane) { pane.style.display = 'flex'; pane.style.flexDirection = 'column'; }
  el.classList.add('active');
  if (name === 'qr') generateQR();
}// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = '') {
  let t = document.getElementById('toast');
  let icon = '';
  if (type === 'success') {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else if (type === 'info') {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }
  t.innerHTML = icon + '<span>' + msg + '</span>';
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3500);
}

// ── TICKET DESIGNER ───────────────────────────────────────────
const DEFAULT_DESIGN = {
    bgImage: null,
    canvasWidth: 800,
    canvasHeight: 226,
    elements: [
        { id: 'presents_text', label: 'Proudly Presents', text: 'PROUDLY PRESENTS', x: 12, y: 15, size: 7, color: '#a1a1a6', rotate: 90, font: 'Anton', fontWeight: 'bold' },
        { id: 'thynk_text', label: 'Thynk Unlimited', text: 'THYNK UNLIMITED', x: 12, y: 125, size: 7, color: '#a1a1a6', rotate: 90, font: 'Anton', fontWeight: 'bold' },
        { id: 'title_jumanji', label: 'Title (Jumanji)', text: 'JUMANJI', x: 42, y: 15, size: 54, color: '#ffffff', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'sub_solo', label: 'Subtitle', text: 'SOLO CONCERT', x: 42, y: 80, size: 14, color: '#ffffff', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'attendee_name', label: 'Attendee Name', text: '{first_name} {last_name}', x: 42, y: 110, size: 13, color: '#a855f7', rotate: 0, font: 'Roboto', fontWeight: 'bold' },
        
        { id: 'gate_lbl', label: 'Column Label', text: 'COLUMN', x: 42, y: 150, size: 8, color: '#a1a1a6', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'gate_val', label: 'Column Value', text: '{block}', x: 42, y: 168, size: 24, color: '#ffffff', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'sep1', label: 'Separator 1', type: 'rect', x: 92, y: 152, w: 1, h: 42, color: '#ffffff', rotate: 0 },
        
        { id: 'row_lbl', label: 'Row Label', text: 'ROW', x: 108, y: 150, size: 8, color: '#a1a1a6', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'row_val', label: 'Row Value', text: '{row}', x: 108, y: 168, size: 24, color: '#ffffff', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'sep2', label: 'Separator 2', type: 'rect', x: 158, y: 152, w: 1, h: 42, color: '#ffffff', rotate: 0 },
        
        { id: 'seat_lbl', label: 'Seat Label', text: 'SEAT', x: 174, y: 150, size: 8, color: '#a1a1a6', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'seat_val', label: 'Seat Value', text: '{seat_num}', x: 174, y: 168, size: 22, color: '#ffffff', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        
        { id: 'date_day', label: 'Date Day', text: 'SUNDAY, 12', x: 410, y: 15, size: 28, color: '#ffffff', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'date_year', label: 'Date Year', text: 'JULY 2026', x: 422, y: 48, size: 28, color: '#ffffff', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        
        { id: 'time_text', label: 'Time', text: 'START AT 10 AM', x: 435, y: 130, size: 12, color: '#ffffff', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'loc_street', label: 'Location Street', text: 'RUDAKIY 245,', x: 478, y: 152, size: 9, color: '#a1a1a6', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        { id: 'loc_branch', label: 'Location Branch', text: '{branch}', x: 405, y: 168, size: 9, color: '#a1a1a6', rotate: 0, font: 'Anton', fontWeight: 'bold' },
        
        { id: 'stub_divider', label: 'Stub Divider', type: 'rect', x: 618, y: 0, w: 2, h: 226, color: '#ffffff', rotate: 0, borderWidth: 1, borderColor: '#ffffff', borderStyle: 'dashed' },
        { id: 'stub_bg', label: 'Stub BG', type: 'rect', x: 620, y: 0, w: 180, h: 226, color: '#09090b', rotate: 0 },
        { id: 'admit_one', label: 'Admit One Text', text: 'ADMIT ONE', x: 635, y: 15, size: 36, color: '#ffffff', rotate: 90, font: 'Anton', fontWeight: 'bold' },
        
        { id: 'barcode_b1', label: 'Barcode Bar 1', type: 'rect', x: 740, y: 15, w: 3, h: 196, color: '#ffffff', rotate: 0 },
        { id: 'barcode_b2', label: 'Barcode Bar 2', type: 'rect', x: 746, y: 15, w: 2, h: 196, color: '#ffffff', rotate: 0 },
        { id: 'barcode_b3', label: 'Barcode Bar 3', type: 'rect', x: 751, y: 15, w: 5, h: 196, color: '#ffffff', rotate: 0 },
        { id: 'barcode_b4', label: 'Barcode Bar 4', type: 'rect', x: 759, y: 15, w: 1, h: 196, color: '#ffffff', rotate: 0 },
        { id: 'barcode_b5', label: 'Barcode Bar 5', type: 'rect', x: 763, y: 15, w: 4, h: 196, color: '#ffffff', rotate: 0 },
        { id: 'barcode_b6', label: 'Barcode Bar 6', type: 'rect', x: 770, y: 15, w: 2, h: 196, color: '#ffffff', rotate: 0 },
        { id: 'barcode_b7', label: 'Barcode Bar 7', type: 'rect', x: 775, y: 15, w: 3, h: 196, color: '#ffffff', rotate: 0 },
        { id: 'barcode_b8', label: 'Barcode Bar 8', type: 'rect', x: 781, y: 15, w: 1, h: 196, color: '#ffffff', rotate: 0 },
        { id: 'barcode_b9', label: 'Barcode Bar 9', type: 'rect', x: 785, y: 15, w: 4, h: 196, color: '#ffffff', rotate: 0 },
        
        { id: 'ticket_id_val', label: 'Ticket ID (Barcode)', text: '{ticket_id}', x: 708, y: 20, size: 8, color: '#a1a1a6', rotate: 90, font: 'Anton', fontWeight: 'bold' }
    ]
};

let currentDesign = JSON.parse(localStorage.getItem('ticketDesign')) || JSON.parse(JSON.stringify(DEFAULT_DESIGN));

// Migration: Ensure existing designs switch attendee_name to Roboto for Cyrillic compatibility
if (currentDesign && currentDesign.elements) {
    const nameEl = currentDesign.elements.find(e => e.id === 'attendee_name');
    if (nameEl && (nameEl.font === 'Anton' || nameEl.font === 'anton')) {
        nameEl.font = 'Roboto';
        try { localStorage.setItem('ticketDesign', JSON.stringify(currentDesign)); } catch(e){}
    }
}

let activeElementId = null;

let designHistory = [];
let historyIndex = -1;

function saveHistory() {
    if (historyIndex < designHistory.length - 1) {
        designHistory = designHistory.slice(0, historyIndex + 1);
    }
    designHistory.push(JSON.stringify(currentDesign));
    if (designHistory.length > 30) {
        designHistory.shift();
    } else {
        historyIndex++;
    }
    try {
        localStorage.setItem('ticketDesign', JSON.stringify(currentDesign));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
        if (e.name === 'QuotaExceededError') {
            showToast('Storage quota exceeded! Try using smaller images.', 'error');
        }
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        currentDesign = JSON.parse(designHistory[historyIndex]);
        initDesigner();
        showToast('Undo', 'info');
    }
}

function redo() {
    if (historyIndex < designHistory.length - 1) {
        historyIndex++;
        currentDesign = JSON.parse(designHistory[historyIndex]);
        initDesigner();
        showToast('Redo', 'info');
    }
}

function initDesigner() {
    const canvas = document.getElementById('ticketCanvas');
    if (!canvas) return;
    
    // Set inputs
    const wInput = document.getElementById('canvas-width');
    const hInput = document.getElementById('canvas-height');
    if (wInput) wInput.value = currentDesign.canvasWidth;
    if (hInput) hInput.value = currentDesign.canvasHeight;
    
    canvas.style.width = currentDesign.canvasWidth + 'px';
    canvas.style.height = currentDesign.canvasHeight + 'px';
    
    if (currentDesign.bgImage) {
        canvas.style.backgroundImage = `url(${currentDesign.bgImage})`;
    } else {
        canvas.style.backgroundColor = '#1a202c';
        canvas.style.backgroundImage = 'none';
    }
    
    renderDesignerElements();
    renderDesignerControls();
    
    if (designHistory.length === 0) saveHistory();
}

function handleBgUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Limit width to 1000px to avoid breaking UI, maintaining aspect ratio
                let w = img.width;
                let h = img.height;
                if (w > 1000) {
                    h = Math.round((1000 / w) * h);
                    w = 1000;
                }
                
                // Compress image to avoid localStorage quota (5MB limit)
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = w;
                tmpCanvas.height = h;
                const ctx = tmpCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                // Convert to JPEG with 80% quality to ensure it fits in storage
                const compressedDataUrl = tmpCanvas.toDataURL('image/jpeg', 0.8);
                
                currentDesign.bgImage = compressedDataUrl;
                saveHistory();
                initDesigner();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function updateCanvasSize() {
    const w = parseInt(document.getElementById('canvas-width').value) || 800;
    const h = parseInt(document.getElementById('canvas-height').value) || 280;
    currentDesign.canvasWidth = w;
    currentDesign.canvasHeight = h;
    const canvas = document.getElementById('ticketCanvas');
    if (canvas) {
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
    }
    saveHistory();
}

function renderDesignerElements() {
    const canvas = document.getElementById('ticketCanvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    
    // Create smart guides
    const vGuide = document.createElement('div');
    vGuide.className = 'smart-guide vertical';
    vGuide.id = 'guide-v';
    canvas.appendChild(vGuide);
    
    const hGuide = document.createElement('div');
    hGuide.className = 'smart-guide horizontal';
    hGuide.id = 'guide-h';
    canvas.appendChild(hGuide);
    
    currentDesign.elements.forEach(el => {
        const div = document.createElement('div');
        div.className = `draggable-element ${el.id === activeElementId ? 'selected' : ''}`;
        div.id = `el-${el.id}`;
        
        div.style.left = el.x + 'px';
        div.style.top = el.y + 'px';
        div.style.transform = `rotate(${el.rotate}deg)`;
        if (el.opacity !== undefined) div.style.opacity = el.opacity / 100;
        
        if (!el.type || el.type === 'text') {
            div.innerText = el.text;
            div.style.fontSize = el.size + 'px';
            div.style.color = el.color;
            let fontFamily = 'Helvetica, Arial, sans-serif';
            if (el.font === 'times') fontFamily = '"Times New Roman", Times, serif';
            if (el.font === 'courier') fontFamily = '"Courier New", Courier, monospace';
            if (el.font === 'Anton' || el.font === 'anton') fontFamily = '"Anton", sans-serif';
            if (el.font === 'Roboto' || el.font === 'roboto') fontFamily = '"Roboto", sans-serif';
            div.style.fontFamily = fontFamily;
            div.style.fontWeight = el.fontWeight === 'normal' || el.fontWeight === 'italic' ? 'normal' : 'bold';
            div.style.fontStyle = el.fontWeight === 'italic' ? 'italic' : 'normal';
        } else {
            if (el.type === 'rect') {
                div.style.width = el.w + 'px'; div.style.height = el.h + 'px';
                div.style.backgroundColor = el.color;
                if (el.borderWidth) {
                    div.style.border = `${el.borderWidth}px ${el.borderStyle || 'solid'} ${el.borderColor}`;
                }
            } else if (el.type === 'circle') {
                div.style.width = (el.r * 2) + 'px'; div.style.height = (el.r * 2) + 'px';
                div.style.borderRadius = '50%';
                div.style.backgroundColor = el.color;
                if (el.borderWidth) {
                    div.style.border = `${el.borderWidth}px ${el.borderStyle || 'solid'} ${el.borderColor}`;
                }
            } else if (el.type === 'triangle') {
                div.style.width = el.w + 'px'; div.style.height = el.h + 'px';
                div.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${el.w} ${el.h}"><polygon points="${el.w/2},0 0,${el.h} ${el.w},${el.h}" fill="${el.color}" stroke="${el.borderColor}" stroke-width="${el.borderWidth}"/></svg>`;
            } else if (el.type === 'image') {
                div.style.width = el.w + 'px'; div.style.height = el.h + 'px';
                div.innerHTML = `<img src="${el.url}" style="width:100%; height:100%; object-fit:contain; pointer-events:none;" />`;
            }
        }
        
        // Drag logic
        div.onmousedown = (e) => {
            if (div.isContentEditable) return; // Don't drag while editing
            e.preventDefault(); // prevent text selection
            
            // Set active element
            activeElementId = el.id;
            
            // Update UI classes visually without re-rendering everything
            document.querySelectorAll('.draggable-element').forEach(node => node.classList.remove('selected'));
            div.classList.add('selected');
            
            document.querySelectorAll('.element-item').forEach(node => node.classList.remove('active'));
            const controlItem = document.getElementById(`control-item-${el.id}`);
            if (controlItem) controlItem.classList.add('active');
            
            let startX = e.clientX;
            let startY = e.clientY;
            let initialX = el.x;
            let initialY = el.y;
            
            let hasMoved = false;
            
            const onMouseMove = (moveEvent) => {
                hasMoved = true;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                let newX = initialX + dx;
                let newY = initialY + dy;
                
                // Smart guide snapping logic
                const SNAP = 6; // pixels
                let snappedX = false;
                let snappedY = false;
                
                const vGuide = document.getElementById('guide-v');
                const hGuide = document.getElementById('guide-h');
                if (vGuide) vGuide.style.display = 'none';
                if (hGuide) hGuide.style.display = 'none';
                
                for (let other of currentDesign.elements) {
                    if (other.id === el.id) continue;
                    
                    // X alignment
                    if (!snappedX && Math.abs(newX - other.x) < SNAP) {
                        newX = other.x;
                        snappedX = true;
                        if (vGuide) {
                            vGuide.style.left = newX + 'px';
                            vGuide.style.display = 'block';
                        }
                    }
                    
                    // Y alignment
                    if (!snappedY && Math.abs(newY - other.y) < SNAP) {
                        newY = other.y;
                        snappedY = true;
                        if (hGuide) {
                            hGuide.style.top = newY + 'px';
                            hGuide.style.display = 'block';
                        }
                    }
                    
                    if (snappedX && snappedY) break;
                }
                
                el.x = newX;
                el.y = newY;
                
                div.style.left = el.x + 'px';
                div.style.top = el.y + 'px';
                
                // Update control inputs directly
                const xInput = document.getElementById(`ctrl-x-${el.id}`);
                const yInput = document.getElementById(`ctrl-y-${el.id}`);
                if (xInput) xInput.value = el.x;
                if (yInput) yInput.value = el.y;
            };
            
            const onMouseUp = () => {
                const vGuide = document.getElementById('guide-v');
                const hGuide = document.getElementById('guide-h');
                if (vGuide) vGuide.style.display = 'none';
                if (hGuide) hGuide.style.display = 'none';
                
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                if (hasMoved) saveHistory();
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        if (!el.type || el.type === 'text') {
            // Double click to edit text directly on canvas
            div.ondblclick = (e) => {
                e.stopPropagation();
                div.contentEditable = true;
                div.focus();
                
                // Select all text
                const range = document.createRange();
                range.selectNodeContents(div);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                
                div.onblur = () => {
                    div.contentEditable = false;
                    el.text = div.innerText;
                    renderDesignerControls();
                    saveHistory();
                };
                
                div.onkeydown = (ke) => {
                    if (ke.key === 'Enter') {
                        ke.preventDefault();
                        div.blur();
                    }
                };
            };
        }

        // Wheel to resize
        div.addEventListener('wheel', (e) => {
            if (activeElementId !== el.id) return;
            e.preventDefault();
            const delta = e.deltaY < 0 ? 1 : -1;
            el.size = Math.max(8, parseInt(el.size) + delta * 2);
            div.style.fontSize = el.size + 'px';
            
            const sizeInput = document.getElementById(`ctrl-size-${el.id}`);
            if (sizeInput) sizeInput.value = el.size;
        }, { passive: false });
        // Resize handle
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        resizer.onmousedown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startSize = parseInt(el.size) || 20;
            const startW = parseInt(el.w) || 100;
            const startH = parseInt(el.h) || 50;
            const startR = parseInt(el.r) || 40;
            
            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                
                if (!el.type || el.type === 'text') {
                    el.size = Math.max(8, startSize + dx);
                    div.style.fontSize = el.size + 'px';
                } else if (el.type === 'circle') {
                    el.r = Math.max(2, startR + dx);
                    div.style.width = (el.r * 2) + 'px';
                    div.style.height = (el.r * 2) + 'px';
                } else {
                    el.w = Math.max(1, startW + dx);
                    el.h = Math.max(1, startH + dy);
                    div.style.width = el.w + 'px';
                    div.style.height = el.h + 'px';
                    if (el.type === 'triangle') {
                       div.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${el.w} ${el.h}"><polygon points="${el.w/2},0 0,${el.h} ${el.w},${el.h}" fill="${el.color}" stroke="${el.borderColor}" stroke-width="${el.borderWidth}"/></svg>`;
                       div.appendChild(resizer);
                    }
                }
                updateControlInputs(el);
            };
            
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        div.appendChild(resizer);
        
        canvas.appendChild(div);
    });
}

// Global keydown for Backspace / Delete removed (merged with the main keyboard shortcut listener below)

function renderDesignerControls() {
    const list = document.getElementById('elementsList');
    if (!list) return;
    list.innerHTML = '';
    
    currentDesign.elements.forEach(el => {
        const item = document.createElement('div');
        item.id = `control-item-${el.id}`;
        item.className = `element-item ${el.id === activeElementId ? 'active' : ''}`;
        
        item.onclick = (e) => {
            if(e.target.tagName !== 'INPUT') {
                activeElementId = el.id;
                
                // Update selection visually
                document.querySelectorAll('.draggable-element').forEach(node => node.classList.remove('selected'));
                const elNode = document.getElementById(`el-${el.id}`);
                if (elNode) elNode.classList.add('selected');
                
                document.querySelectorAll('.element-item').forEach(node => node.classList.remove('active'));
                item.classList.add('active');
            }
        };
        
        item.innerHTML = `
            <div class="element-header" style="gap:4px;">
                <input type="text" value="${el.label}" style="background:transparent; border:none; color:white; font-weight:bold; width:100px; outline:none; font-size:inherit; font-family:inherit; flex-grow:1;" onchange="updateElementProp('${el.id}', 'label', this.value)" onclick="this.select(); event.stopPropagation();">
                <div style="display:flex; gap:2px;">
                    <button class="btn-xs" style="padding:2px 6px" onclick="moveLayer('${el.id}', -1)" title="Send Backward">▼</button>
                    <button class="btn-xs" style="padding:2px 6px" onclick="moveLayer('${el.id}', 1)" title="Bring Forward">▲</button>
                    <button class="btn-xs danger" onclick="deleteDesignerElement('${el.id}')" style="padding:2px 6px">Del</button>
                </div>
            </div>
            <div class="element-controls">
                ${(!el.type || el.type === 'text') ? `
                <div class="control-group" style="grid-column: 1 / -1;">
                    <label>Text Content</label>
                    <input type="text" class="control-input" id="ctrl-text-${el.id}" value="${el.text}" onchange="updateElementProp('${el.id}', 'text', this.value)">
                </div>
                ` : ''}
                <div class="control-group">
                    <label>X Pos</label>
                    <input type="number" class="control-input" id="ctrl-x-${el.id}" value="${el.x}" onchange="updateElementProp('${el.id}', 'x', this.value)">
                </div>
                <div class="control-group">
                    <label>Y Pos</label>
                    <input type="number" class="control-input" id="ctrl-y-${el.id}" value="${el.y}" onchange="updateElementProp('${el.id}', 'y', this.value)">
                </div>
                ${(!el.type || el.type === 'text') ? `
                <div class="control-group">
                    <label>Size</label>
                    <input type="number" class="control-input" id="ctrl-size-${el.id}" value="${el.size}" onchange="updateElementProp('${el.id}', 'size', this.value)">
                </div>
                <div class="control-group">
                    <label>Font</label>
                    <select class="control-input" style="padding:4px" onchange="updateElementProp('${el.id}', 'font', this.value)">
                        <option value="helvetica" ${el.font === 'helvetica' || !el.font ? 'selected' : ''}>Helvetica</option>
                        <option value="times" ${el.font === 'times' ? 'selected' : ''}>Times</option>
                        <option value="courier" ${el.font === 'courier' ? 'selected' : ''}>Courier</option>
                        <option value="Anton" ${el.font === 'Anton' || el.font === 'anton' ? 'selected' : ''}>Anton</option>
                        <option value="Roboto" ${el.font === 'Roboto' || el.font === 'roboto' ? 'selected' : ''}>Roboto</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Style</label>
                    <select class="control-input" style="padding:4px" onchange="updateElementProp('${el.id}', 'fontWeight', this.value)">
                        <option value="bold" ${el.fontWeight === 'bold' || !el.fontWeight ? 'selected' : ''}>Bold</option>
                        <option value="normal" ${el.fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="italic" ${el.fontWeight === 'italic' ? 'selected' : ''}>Italic</option>
                    </select>
                </div>
                ` : ''}
                ${(el.type === 'rect' || el.type === 'triangle') ? `
                <div class="control-group">
                    <label>Width</label>
                    <input type="number" class="control-input" id="ctrl-w-${el.id}" value="${el.w}" onchange="updateElementProp('${el.id}', 'w', this.value)">
                </div>
                <div class="control-group">
                    <label>Height</label>
                    <input type="number" class="control-input" id="ctrl-h-${el.id}" value="${el.h}" onchange="updateElementProp('${el.id}', 'h', this.value)">
                </div>
                ` : ''}
                ${(el.type === 'circle') ? `
                <div class="control-group">
                    <label>Radius</label>
                    <input type="number" class="control-input" id="ctrl-r-${el.id}" value="${el.r}" onchange="updateElementProp('${el.id}', 'r', this.value)">
                </div>
                ` : ''}
                <div class="control-group">
                    <label>Color</label>
                    <input type="color" class="control-input" id="ctrl-color-${el.id}" style="padding:0; height:24px;" value="${el.color}" onchange="updateElementProp('${el.id}', 'color', this.value)">
                </div>
                <div class="control-group">
                    <label>Rotation</label>
                    <input type="number" class="control-input" id="ctrl-rotate-${el.id}" value="${el.rotate}" onchange="updateElementProp('${el.id}', 'rotate', this.value)">
                </div>
                <div class="control-group">
                    <label>Opacity %</label>
                    <input type="number" class="control-input" id="ctrl-opacity-${el.id}" min="0" max="100" value="${el.opacity !== undefined ? el.opacity : 100}" onchange="updateElementProp('${el.id}', 'opacity', this.value)">
                </div>
                ${(el.type && el.type !== 'text') ? `
                <div class="control-group">
                    <label>Border W</label>
                    <input type="number" class="control-input" id="ctrl-bw-${el.id}" value="${el.borderWidth}" onchange="updateElementProp('${el.id}', 'borderWidth', this.value)">
                </div>
                <div class="control-group">
                    <label>Border C</label>
                    <input type="color" class="control-input" id="ctrl-bc-${el.id}" style="padding:0; height:24px;" value="${el.borderColor}" onchange="updateElementProp('${el.id}', 'borderColor', this.value)">
                </div>
                <div class="control-group">
                    <label>Border S</label>
                    <select class="control-input" style="padding:4px" onchange="updateElementProp('${el.id}', 'borderStyle', this.value)">
                        <option value="solid" ${el.borderStyle !== 'dashed' ? 'selected' : ''}>Solid</option>
                        <option value="dashed" ${el.borderStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
                    </select>
                </div>
                ` : ''}
            </div>
        `;
        list.appendChild(item);
    });
}

function updateElementProp(id, prop, value) {
    const el = currentDesign.elements.find(e => e.id === id);
    if (el) {
        if (['color', 'text', 'label', 'borderColor', 'borderStyle', 'font', 'fontWeight'].includes(prop)) {
            el[prop] = value;
        } else {
            el[prop] = parseInt(value, 10) || 0;
        }
        
        // Update DOM directly instead of full re-render if possible
        const div = document.getElementById(`el-${el.id}`);
        if (div) {
            if (prop === 'x') div.style.left = el.x + 'px';
            if (prop === 'y') div.style.top = el.y + 'px';
            if (prop === 'size') div.style.fontSize = el.size + 'px';
            if (prop === 'color') {
                if (!el.type || el.type === 'text') div.style.color = el.color;
                else if (el.type === 'triangle') div.querySelector('polygon').setAttribute('fill', el.color);
                else div.style.backgroundColor = el.color;
            }
            if (prop === 'rotate') div.style.transform = `rotate(${el.rotate}deg)`;
            if (prop === 'opacity') div.style.opacity = el.opacity / 100;
            if (prop === 'text') div.innerText = el.text;
            
            if (['w', 'h', 'r', 'borderWidth', 'borderColor', 'borderStyle', 'font', 'fontWeight'].includes(prop)) {
                renderDesignerElements(); // Re-render needed for shapes and fonts
            }
            saveHistory();
        }
    }
}

function updateControlInputs(el) {
    const xInput = document.getElementById(`ctrl-x-${el.id}`);
    const yInput = document.getElementById(`ctrl-y-${el.id}`);
    const sizeInput = document.getElementById(`ctrl-size-${el.id}`);
    const wInput = document.getElementById(`ctrl-w-${el.id}`);
    const hInput = document.getElementById(`ctrl-h-${el.id}`);
    const rInput = document.getElementById(`ctrl-r-${el.id}`);
    
    if (xInput) xInput.value = el.x;
    if (yInput) yInput.value = el.y;
    if (sizeInput) sizeInput.value = el.size;
    if (wInput) wInput.value = el.w;
    if (hInput) hInput.value = el.h;
    if (rInput) rInput.value = el.r;
}

function promptDesignerImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => {
                // Calculate dimensions fitting within 150px
                let w = img.width;
                let h = img.height;
                const maxDim = 150;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h = (h / w) * maxDim; w = maxDim; } 
                    else { w = (w / h) * maxDim; h = maxDim; }
                }
                
                // Compress/resize the image element to prevent localStorage quota issues
                const tmpCanvas = document.createElement('canvas');
                let compW = img.width;
                let compH = img.height;
                if (compW > 300 || compH > 300) {
                    if (compW > compH) { compH = Math.round((300 / compW) * compH); compW = 300; }
                    else { compW = Math.round((300 / compH) * compW); compH = 300; }
                }
                tmpCanvas.width = compW;
                tmpCanvas.height = compH;
                const ctx = tmpCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0, compW, compH);
                
                const compressedDataUrl = tmpCanvas.toDataURL('image/png');
                addDesignerElement('image', compressedDataUrl, w, h);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function addDesignerElement(type = 'text', dataUrl = null, w = 100, h = 50) {
    const newId = 'custom_' + Math.random().toString(36).substr(2, 6);
    let el = {
        id: newId, type: type,
        x: 100, y: 100, color: '#ffffff', rotate: 0
    };
    if (type === 'text') {
        el.label = 'Custom Text'; el.text = 'New Text'; el.size = 20; el.font = 'helvetica'; el.fontWeight = 'bold';
    } else if (type === 'rect') {
        el.label = 'Rectangle'; el.w = 100; el.h = 50; el.borderWidth = 0; el.borderColor = '#000000';
    } else if (type === 'circle') {
        el.label = 'Circle'; el.r = 40; el.borderWidth = 0; el.borderColor = '#000000';
    } else if (type === 'triangle') {
        el.label = 'Triangle'; el.w = 100; el.h = 100; el.borderWidth = 0; el.borderColor = '#000000';
    } else if (type === 'image') {
        el.label = 'Image'; el.w = w; el.h = h; el.url = dataUrl;
    }
    currentDesign.elements.push(el);
    activeElementId = newId;
    renderDesignerElements();
    renderDesignerControls();
    saveHistory();
}

function moveLayer(id, dir) {
    const idx = currentDesign.elements.findIndex(e => e.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx >= 0 && newIdx < currentDesign.elements.length) {
        const temp = currentDesign.elements[idx];
        currentDesign.elements[idx] = currentDesign.elements[newIdx];
        currentDesign.elements[newIdx] = temp;
        renderDesignerElements();
        renderDesignerControls();
        saveHistory();
    }
}

function deleteDesignerElement(id) {
    currentDesign.elements = currentDesign.elements.filter(e => e.id !== id);
    if (activeElementId === id) activeElementId = null;
    renderDesignerElements();
    renderDesignerControls();
    saveHistory();
}

function saveDesign() {
    try {
        localStorage.setItem('ticketDesign', JSON.stringify(currentDesign));
        showToast('Design saved successfully!', 'success');
    } catch (e) {
        console.error('Failed to save design:', e);
        if (e.name === 'QuotaExceededError') {
            showToast('Storage full! Cannot save design. Try using smaller images.', 'error');
        } else {
            showToast('Failed to save design.', 'error');
        }
    }
}

function loadJumanjiPreset() {
    if (confirm('Load the Jumanji design template? Your current unsaved designer elements will be replaced.')) {
        currentDesign = JSON.parse(JSON.stringify(DEFAULT_DESIGN));
        initDesigner();
        saveHistory();
        showToast('Jumanji theme loaded!', 'success');
    }
}

function resetDesigner() {
    if(confirm('Reset to default design? All changes will be lost.')) {
        currentDesign = JSON.parse(JSON.stringify(DEFAULT_DESIGN));
        localStorage.removeItem('ticketDesign');
        initDesigner();
        showToast('Design reset to default (Jumanji Theme)', 'info');
    }
}

function flipDesign(axis) {
    const w = currentDesign.canvasWidth || 800;
    const h = currentDesign.canvasHeight || 226;
    
    currentDesign.elements.forEach(el => {
        let elW = el.w;
        let elH = el.h;
        
        if (!el.type || el.type === 'text') {
            elW = el.size * 5; // rough estimate
            elH = el.size;
        } else if (el.type === 'circle') {
            elW = el.r * 2;
            elH = el.r * 2;
        }
        
        elW = elW || 50;
        elH = elH || 50;
        
        if (axis === 'x') {
            el.x = w - el.x - elW;
        } else if (axis === 'y') {
            el.y = h - el.y - elH;
        }
        
        if (el.type === 'image' && el.url) {
            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const ctx = tempCanvas.getContext('2d');
                if (axis === 'x') {
                    ctx.translate(img.width, 0);
                    ctx.scale(-1, 1);
                } else if (axis === 'y') {
                    ctx.translate(0, img.height);
                    ctx.scale(1, -1);
                }
                ctx.drawImage(img, 0, 0);
                el.url = tempCanvas.toDataURL('image/png');
                renderDesignerElements();
            };
            img.src = el.url;
        }
    });
    
    if (currentDesign.bgImage) {
        const bgImg = new Image();
        bgImg.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = bgImg.width;
            tempCanvas.height = bgImg.height;
            const ctx = tempCanvas.getContext('2d');
            if (axis === 'x') {
                ctx.translate(bgImg.width, 0);
                ctx.scale(-1, 1);
            } else if (axis === 'y') {
                ctx.translate(0, bgImg.height);
                ctx.scale(1, -1);
            }
            ctx.drawImage(bgImg, 0, 0);
            currentDesign.bgImage = tempCanvas.toDataURL('image/jpeg', 0.8);
            initDesigner();
        };
        bgImg.src = currentDesign.bgImage;
    }
    
    renderDesignerElements();
    renderDesignerControls();
    showToast(`Design flipped ${axis === 'x' ? 'horizontally' : 'vertically'}!`, 'success');
}

// Hook into existing init
const _originalInit = init;
init = async function() {
    await _originalInit();
    initDesigner();
}

// Global Keyboard Shortcuts (Copy / Paste / Delete)
let copiedElement = null;

document.addEventListener('keydown', (e) => {
    // Only trigger if we are on the Custom Ticket tab (where designer is active)
    const designerTab = document.getElementById('tab-designer');
    if (!designerTab || designerTab.style.display === 'none') return;

    // Do not interfere if the user is typing in an input or textarea or contenteditable element
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;

    // Copy: Ctrl+C or Cmd+C
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (activeElementId) {
            const el = currentDesign.elements.find(e => e.id === activeElementId);
            if (el) {
                // Deep copy the element
                copiedElement = JSON.parse(JSON.stringify(el));
                showToast('Element copied!', 'success');
            }
        }
    }

    // Paste: Ctrl+V or Cmd+V
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (copiedElement) {
            e.preventDefault();
            const newEl = JSON.parse(JSON.stringify(copiedElement));
            newEl.id = Date.now().toString() + Math.floor(Math.random() * 1000); // Generate new unique ID
            newEl.x = parseInt(newEl.x) + 15; // Offset slightly so it doesn't perfectly overlap
            newEl.y = parseInt(newEl.y) + 15;
            
            // Generate a unique label
            newEl.label = newEl.label + ' (copy)';

            currentDesign.elements.push(newEl);
            activeElementId = newEl.id;
            
            renderDesignerElements();
            renderDesignerControls();
            saveHistory();
            showToast('Element pasted!', 'success');
        }
    }
    
    // Undo / Redo: Ctrl+Z or Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
            redo();
        } else {
            undo();
        }
    }
    
    // Redo: Ctrl+Y or Cmd+Y
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
    }
    
    // Keyboard Movement
    const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
    if (movementKeys.includes(e.key) && activeElementId) {
        e.preventDefault(); // prevent browser scrolling
        const el = currentDesign.elements.find(e => e.id === activeElementId);
        if (el) {
            const step = e.shiftKey ? 10 : 1; // Hold shift to move faster
            
            if (e.key === 'ArrowUp' || e.key === 'PageUp') el.y -= step;
            if (e.key === 'ArrowDown' || e.key === 'PageDown') el.y += step;
            if (e.key === 'ArrowLeft' || e.key === 'Home') el.x -= step;
            if (e.key === 'ArrowRight' || e.key === 'End') el.x += step;
            
            // Fast DOM update to avoid full re-render lag
            const div = document.getElementById(`el-${el.id}`);
            if (div) {
                div.style.left = el.x + 'px';
                div.style.top = el.y + 'px';
            }
            
            // Update sidebar inputs
            const xInput = document.getElementById(`ctrl-x-${el.id}`);
            const yInput = document.getElementById(`ctrl-y-${el.id}`);
            if (xInput) xInput.value = el.x;
            if (yInput) yInput.value = el.y;
            
            // Debounce saving history so we don't spam the history stack while holding the key down
            clearTimeout(window._moveHistoryTimer);
            window._moveHistoryTimer = setTimeout(() => saveHistory(), 400);
        }
    }
    
    // Delete shortcut
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeElementId) {
            e.preventDefault();
            deleteDesignerElement(activeElementId);
            showToast('Element deleted', 'success');
        }
    }
});
