// ============================================================
//  MOVIE DAY REGISTRATION — MAIN APP
// ============================================================

// ── i18n Translation Engine ──────────────────────────────────
const TRANSLATIONS = {
  en: {
    hero_sub:        'Join us for an unforgettable cinematic experience.<br/>Register below to secure your seat.',
    step_info:       'Your Info',
    step_seat:       'Choose Seat',
    step_confirm:    'Confirm',
    personal_info:   'Personal Information',
    personal_sub:    'Fill in your details to get started',
    first_name:      'First Name',
    last_name:       'Last Name',
    phone:           'Phone Number',
    eng_level:       'English Level',
    select_level:    'Select your level',
    branch:          'Branch',
    other_branch:    'Please specify your branch',
    continue_btn:    'Continue to Seat Selection',
    choose_seat:     'Choose Your Seat',
    seat_sub:        'Click on an available seat to select it',
    confirm_seat:    'Confirm Seat',
    review_title:    'Review & Submit',
    review_sub:      'Please verify your details before submitting',
    terms:           'I confirm my details are correct and agree to attend the event',
    submit_btn:      'Submit & Get Ticket',
    success_title:   "You're registered!",
    success_sub:     'Your ticket has been downloaded. See you at Movie Day!',
    download_again:  'Download Ticket Again',
    register_another:'Register Another Person',
    ph_first_name:   'Enter your first name',
    ph_last_name:    'Enter your last name',
    ph_other_branch: 'Enter your branch name',
    err_first_name:   'Please enter your first name',
    err_last_name:    'Please enter your last name',
    err_phone:        'Please enter a valid phone number',
    err_level:        'Please select your English level',
    err_branch:       'Please select your branch',
    err_other_branch: 'Please specify your branch name',
    zoom_fit:        'Fit',
  },
  uz: {
    hero_sub:        'Unutilmas kino tajribasiga qo\'shiling.<br/>O\'rningizni band qilish uchun quyida ro\'yxatdan o\'ting.',
    step_info:       'Ma\'lumotlar',
    step_seat:       'Joy tanlash',
    step_confirm:    'Tasdiqlash',
    personal_info:   'Shaxsiy ma\'lumotlar',
    personal_sub:    'Boshlash uchun ma\'lumotlaringizni kiriting',
    first_name:      'Ism',
    last_name:       'Familiya',
    phone:           'Telefon raqami',
    eng_level:       'Ingliz tili darajasi',
    select_level:    'Darajangizni tanlang',
    branch:          'Filial',
    other_branch:    'Filialni ko\'rsating',
    continue_btn:    'Joy tanlashga o\'tish',
    choose_seat:     'Joyingizni tanlang',
    seat_sub:        'Bu sxemada bizning o\\'rindiqlar joylashuvi kursatilgan va siz uzingizga maqul bulgan bush urindiqni tanlang va uz joyingizni band qiling',
    confirm_seat:    'Joyni tasdiqlash',
    review_title:    'Ko\'rib chiqish va yuborish',
    review_sub:      'Yuborishdan oldin ma\'lumotlaringizni tekshiring',
    terms:           'Ma\'lumotlarim to\'g\'ri ekanligini va tadbirga qatnashishga roziligimni tasdiqlayman',
    submit_btn:      'Yuborish va chipta olish',
    success_title:   'Ro\'yxatdan o\'tdingiz!',
    success_sub:     'Chiptangiz yuklandi. Movie Day\'da ko\'rishguncha!',
    download_again:  'Chiptani qayta yuklash',
    register_another:'Boshqa kishini ro\'yxatdan o\'tkazish',
    ph_first_name:   'Ismingizni kiriting',
    ph_last_name:    'Familiyangizni kiriting',
    ph_other_branch: 'Filial nomini kiriting',
    err_first_name:   'Ismingizni kiriting',
    err_last_name:    'Familiyangizni kiriting',
    err_phone:        'Telefon raqamingizni to\'liq kiriting',
    err_level:        'Ingliz tili darajangizni tanlang',
    err_branch:       'Filialingizni tanlang',
    err_other_branch: 'Filial nomini kiriting',
    zoom_fit:        'Sig‘dirish',
  }
};

let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  const t = TRANSLATIONS[lang];
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-uz').classList.toggle('active', lang === 'uz');

  // Translate text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) el.placeholder = t[key];
  });
}

// ── Phone auto-formatter ──────────────────────────────────────
// Formats digits as: 99 111 11 22  (max 10 digits)
function formatPhone(input) {
  // Strip everything except digits
  let digits = input.value.replace(/\D/g, '').slice(0, 10);
  let formatted = '';
  if (digits.length > 0) formatted  = digits.slice(0, 2);
  if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
  if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
  if (digits.length > 7) formatted += ' ' + digits.slice(7, 10);
  input.value = formatted;
}


// 2D Layout Blocks Config (matches the hall design)
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

function formatSeatForDisplay(seatId) {
  if (!seatId) return '—';
  const parts = seatId.split('-');
  if (parts.length < 3) return seatId;
  const [blockId, row, col] = parts;
  return `${blockId} - R${row} - S${col}`; // e.g. L1-R1-S1
}

// ── State ────────────────────────────────────────────────────
let formData    = {};
let selectedSeat = null;
let takenSeats  = new Set();
let realtimeSub = null;
let lastRegistration = null;

// ── Custom Dropdown ─────────────────────────────────────────
function toggleDropdown() {
  const sel = document.getElementById('levelSelect');
  sel.classList.toggle('open');
}

function selectLevel(el) {
  const val = el.dataset.value;
  document.getElementById('englishLevel').value = val;
  document.getElementById('levelDisplay').textContent = el.textContent.trim();
  document.getElementById('levelDisplay').classList.add('filled');
  document.querySelectorAll('.cs-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('levelSelect').classList.remove('open');

  // Clean error tooltip if visible
  const tooltip = document.getElementById('levelSelect').closest('.form-group')?.querySelector('.input-error-tooltip');
  if (tooltip) tooltip.remove();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const sel = document.getElementById('levelSelect');
  if (sel && !sel.contains(e.target)) sel.classList.remove('open');
});

// ── Toast helper ─────────────────────────────────────────────
function showToast(msg, type = '') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  let icon = '';
  if (type === 'success') {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else if (type === 'info') {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }
  t.innerHTML = icon + '<span>' + msg + '</span>';
  t.className    = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3500);
}

// ── Step navigation ──────────────────────────────────────────
function goToStep(n) {
  [1,2,3,'Success'].forEach(s => {
    const el = document.getElementById('step' + s);
    if (el) el.classList.add('hidden');
    const ind = document.getElementById('step' + s + '-indicator');
    if (ind) ind.classList.remove('active','done');
  });

  const target = document.getElementById('step' + n);
  if (target) target.classList.remove('hidden');

  // Update indicators
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById('step' + i + '-indicator');
    if (!ind) continue;
    if (i < n)  ind.classList.add('done');
    if (i === n) ind.classList.add('active');
  }

  if (n === 2) initSeatMap();
  if (n === 3) buildReview();
}

function clearErrors() {
  document.querySelectorAll('.input-error-tooltip').forEach(el => el.remove());
}

function showFieldError(input, errorKey) {
  const el = typeof input === 'string' ? document.getElementById(input) : input;
  if (!el) return;

  let container = el.closest('.form-group');
  if (!container && el.name === 'branch') {
    container = document.querySelector('.branch-options');
  }
  if (!container) return;

  const existing = container.querySelector('.input-error-tooltip');
  if (existing) existing.remove();

  const msg = TRANSLATIONS[currentLang][errorKey] || errorKey;
  const tooltip = document.createElement('div');
  tooltip.className = 'input-error-tooltip';
  tooltip.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <span>${msg}</span>
  `;
  container.appendChild(tooltip);

  container.classList.remove('shake-error');
  void container.offsetWidth; // force reflow
  container.classList.add('shake-error');
}

// Clean validation error tooltips in real-time
document.querySelectorAll('#firstName, #lastName, #phone, #otherBranch').forEach(input => {
  input.addEventListener('input', () => {
    if (input.value.trim() !== '') {
      const tooltip = input.closest('.form-group')?.querySelector('.input-error-tooltip');
      if (tooltip) tooltip.remove();
    }
  });
});

// ── Step 1: form submit ───────────────────────────────────────
document.getElementById('regForm').addEventListener('submit', function(e) {
  e.preventDefault();

  clearErrors();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const rawPhone  = document.getElementById('phone').value.trim();
  const level     = document.getElementById('englishLevel').value;
  const branch    = document.querySelector('input[name="branch"]:checked');

  if (!firstName) {
    showFieldError('firstName', 'err_first_name');
    document.getElementById('firstName').focus();
    return;
  }
  if (!lastName) {
    showFieldError('lastName', 'err_last_name');
    document.getElementById('lastName').focus();
    return;
  }
  if (!rawPhone || rawPhone.length < 12) {
    showFieldError('phone', 'err_phone');
    document.getElementById('phone').focus();
    return;
  }
  if (!level) {
    showFieldError('levelSelect', 'err_level');
    return;
  }
  
  if (!branch) {
    const radio = document.querySelector('input[name="branch"]');
    showFieldError(radio, 'err_branch');
    return;
  } else {
    let branchVal = branch.value;
    if (branchVal === 'Other') {
      const ob = document.getElementById('otherBranch').value.trim();
      if (!ob) {
        showFieldError('otherBranch', 'err_other_branch');
        document.getElementById('otherBranch').focus();
        return;
      }
    }
  }

  let branchVal = branch.value;
  if (branchVal === 'Other') {
    branchVal = document.getElementById('otherBranch').value.trim();
  }
  const phone = '+998 ' + rawPhone;

  formData = { firstName, lastName, phone, englishLevel: level, branch: branchVal };
  goToStep(2);
});

// Show/hide "Other" branch field and clear errors
document.querySelectorAll('input[name="branch"]').forEach(r => {
  r.addEventListener('change', () => {
    const tooltip = document.querySelector('.branch-options .input-error-tooltip');
    if (tooltip) tooltip.remove();

    document.getElementById('otherBranchGroup').style.display =
      r.value === 'Other' && r.checked ? 'flex' : 'none';
  });
});

// ── Step 2: Seat Map ─────────────────────────────────────────
async function initSeatMap() {
  const map = document.getElementById('seatMap');
  map.innerHTML = '<div class="loading-seats"><span class="loading-dot"></span> Loading seat availability…</div>';

  try {
    const { data, error } = await sb
      .from('movie_registrations')
      .select('seat')
      .not('seat', 'is', null);

    if (error) {
      // DB not set up yet — show all seats as available with a warning
      console.warn('Seat DB error (table may not exist yet):', error.message);
      showToast('Database not connected — showing preview mode. Run setup-database.sql first.', 'error');
      takenSeats = new Set();
    } else {
      takenSeats = new Set((data || []).map(r => r.seat));
    }
  } catch(e) {
    console.warn('Connection error:', e);
    takenSeats = new Set();
  }

  renderSeatMap();
  subscribeSeats();
}

function renderSeatMap() {
  const map = document.getElementById('seatMap');
  map.innerHTML = '';

  BLOCKS.forEach(blockRow => {
    const rowEl = document.createElement('div');
    rowEl.className = 'block-row';

    // Left group: L1 and L2 (or L3 & L4, L5 & L6)
    const leftGroup = document.createElement('div');
    leftGroup.className = 'block-group left-group';
    leftGroup.appendChild(createBlockEl(blockRow[0]));
    leftGroup.appendChild(createBlockEl(blockRow[1]));

    // Center group: C1 and C2 (or C3 & C4, C5 & C6)
    const centerGroup = document.createElement('div');
    centerGroup.className = 'block-group center-group';
    centerGroup.appendChild(createBlockEl(blockRow[2]));
    centerGroup.appendChild(createBlockEl(blockRow[3]));

    // Right group: R1 and R2 (or R3 & R4, R5 & R6)
    const rightGroup = document.createElement('div');
    rightGroup.className = 'block-group right-group';
    rightGroup.appendChild(createBlockEl(blockRow[4]));
    rightGroup.appendChild(createBlockEl(blockRow[5]));

    rowEl.appendChild(leftGroup);
    rowEl.appendChild(centerGroup);
    rowEl.appendChild(rightGroup);

    map.appendChild(rowEl);
  });

  // Calculate and apply scaling automatically, then enable dragging to pan
  updateZoom();
  initDragToScroll();
}

function createBlockEl(block) {
  const blockEl = document.createElement('div');
  blockEl.className = 'seat-block' + (block.vip ? ' vip' : '');
  
  const titleEl = document.createElement('div');
  titleEl.className = 'block-title';
  titleEl.textContent = block.name;
  blockEl.appendChild(titleEl);

  const colHeadersEl = document.createElement('div');
  colHeadersEl.className = 'block-col-headers';
  for (let c = 1; c <= block.cols; c++) {
    const colHeader = document.createElement('div');
    colHeader.className = 'col-header';
    colHeader.textContent = c;
    colHeadersEl.appendChild(colHeader);
  }
  blockEl.appendChild(colHeadersEl);

  const rowsEl = document.createElement('div');
  rowsEl.className = 'block-rows-container';

  for (let r = 1; r <= block.rows; r++) {
    const rowLine = document.createElement('div');
    rowLine.className = 'block-row-item';

    const rowLabel = document.createElement('div');
    rowLabel.className = 'block-row-label';
    rowLabel.textContent = r;
    rowLine.appendChild(rowLabel);

    for (let c = 1; c <= block.cols; c++) {
      const id = `${block.id}-${r}-${c}`;
      const seat = document.createElement('div');
      seat.className = 'seat' + (block.vip ? ' vip' : ' regular');
      
      const friendlyName = block.name.replace(' · VIP', '');
      const seatLabel = `${friendlyName}, Row ${r}, Seat ${c}`;

      if (takenSeats.has(id)) {
        seat.classList.add('taken');
        seat.title = seatLabel + ' (Taken)';
      } else if (selectedSeat === id) {
        seat.classList.add('selected');
        seat.title = seatLabel + ' (Selected)';
      } else {
        seat.title = seatLabel + ' (Available)';
        seat.addEventListener('click', () => selectSeat(id));
      }
      rowLine.appendChild(seat);
    }
    rowsEl.appendChild(rowLine);
  }
  blockEl.appendChild(rowsEl);

  return blockEl;
}

function selectSeat(id) {
  if (takenSeats.has(id)) return;
  selectedSeat = id;
  const parts = id.split('-');
  const blockId = parts[0];
  const row = parts[1];
  const col = parts[2];
  
  let blockName = blockId;
  for (const blockRow of BLOCKS) {
    const block = blockRow.find(b => b.id === blockId);
    if (block) {
      blockName = block.name.replace(' · VIP', '');
      break;
    }
  }

  document.getElementById('selectedSeatLabel').textContent = `${blockName} — Row ${row}, Seat ${col}`;
  document.getElementById('seatInfo').style.display = 'block';
  document.getElementById('confirmSeatBtn').disabled = false;
  renderSeatMap();
}


function subscribeSeats() {
  if (realtimeSub) { sb.removeChannel(realtimeSub); }
  realtimeSub = sb
    .channel('movie_seats')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'movie_registrations'
    }, payload => {
      if (payload.new && payload.new.seat) takenSeats.add(payload.new.seat);
      if (payload.old && payload.old.seat) takenSeats.delete(payload.old.seat);
      renderSeatMap();
    })
    .subscribe();
}

// ── Step 3: Review ───────────────────────────────────────────
function buildReview() {
  const container = document.getElementById('reviewTicket');
  const seat = selectedSeat
    ? formatSeatForDisplay(selectedSeat)
    : 'Not selected';

  container.innerHTML = `
    <div class="ticket-stub">
      <div class="stub-header">
        <div class="stub-header-main">
          <div class="stub-event-title">MOVIE DAY 2026</div>
          <div class="stub-event-subtitle">EVENT ENTRY PASS</div>
        </div>
        <div class="stub-logo-badge">
          ${formData.branch.includes('Fast') 
            ? '<img src="logo-fast.png.png" class="stub-badge-img" alt="Fast">' 
            : formData.branch.includes('Oxford')
            ? '<img src="logo-ois.png.png" class="stub-badge-img" alt="OIS">'
            : '<span class="stub-badge-icon" style="color:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>'
          }
        </div>
      </div>
      
      <div class="stub-divider">
        <div class="stub-notch notch-left"></div>
        <div class="stub-dashed-line"></div>
        <div class="stub-notch notch-right"></div>
      </div>
      
      <div class="stub-body">
        <div class="stub-grid">
          <div class="stub-info-item">
            <span class="stub-label">ATTENDEE</span>
            <span class="stub-value">${formData.firstName} ${formData.lastName}</span>
          </div>
          <div class="stub-info-item">
            <span class="stub-label">PHONE NUMBER</span>
            <span class="stub-value">${formData.phone}</span>
          </div>
          <div class="stub-info-item">
            <span class="stub-label">BRANCH</span>
            <span class="stub-value">${formData.branch}</span>
          </div>
          <div class="stub-info-item">
            <span class="stub-label">ENGLISH LEVEL</span>
            <span class="stub-value">
              <span class="stub-level-badge">${formData.englishLevel}</span>
            </span>
          </div>
        </div>

        <div class="stub-seat-highlight">
          <div class="stub-seat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="stub-seat-details">
            <span class="stub-seat-label">RESERVED SEAT</span>
            <span class="stub-seat-value">${seat}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Submit ───────────────────────────────────────────────────
async function submitRegistration() {
  const terms = document.getElementById('termsCheck');
  if (!terms.checked) { showToast('Please confirm your details first.', 'error'); return; }

  const btn = document.getElementById('submitBtn');
  const btnSpan = btn.querySelector('[data-i18n="submit_btn"]');
  btn.disabled = true;
  if (btnSpan) btnSpan.textContent = currentLang === 'uz' ? 'Yuborilmoqda...' : 'Submitting...';

  // Generate ticket ID
  const ticketId = 'MD-' + Date.now().toString(36).toUpperCase();
  const createdAt = new Date().toISOString();

  const payload = {
    first_name:    formData.firstName,
    last_name:     formData.lastName,
    phone:         formData.phone,
    english_level: formData.englishLevel,
    branch:        formData.branch,
    seat:          selectedSeat,
    ticket_id:     ticketId,
    created_at:    createdAt
  };

  const { data, error } = await sb
    .from('movie_registrations')
    .insert([payload])
    .select()
    .single();

  if (error) {
    showToast('Registration failed: ' + (error.message || 'Unknown error'), 'error');
    btn.disabled = false;
    setLang(currentLang);
    return;
  }

  lastRegistration = data || payload;
  showToast('Registered successfully!', 'success');
  generateAndDownloadTicket(lastRegistration);
  showSuccessCard(lastRegistration);
}

// ── Show success ──────────────────────────────────────────────
function showSuccessCard(reg) {
  ['step1','step2','step3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById('step' + i + '-indicator');
    if (ind) ind.classList.add('done');
  }
  const sc = document.getElementById('stepSuccess');
  sc.classList.remove('hidden');

  const seat = reg.seat ? formatSeatForDisplay(reg.seat) : '—';
  document.getElementById('ticketPreview').innerHTML = `
    <strong style="display:inline-flex;align-items:center;gap:6px;margin-bottom:6px;font-size:1.1rem;color:#fff;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#fb923c;"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
      ${reg.ticket_id}
    </strong><br/>
    ${reg.first_name} ${reg.last_name} &nbsp;·&nbsp; ${reg.branch}<br/>
    Seat: ${seat} &nbsp;·&nbsp; ${reg.english_level}
  `;
}

function downloadTicketAgain() {
  if (lastRegistration) generateAndDownloadTicket(lastRegistration);
}

// ── QR Code Generator (Replaces PDF Ticket) ─────────────────────
async function generateAndDownloadTicket(reg) {
  try {
    const seatDisplay = reg.seat ? formatSeatForDisplay(reg.seat) : '—';
    const qrText = `Name: ${reg.first_name} ${reg.last_name}\nPhone: ${reg.phone}\nBranch: ${reg.branch}\nLevel: ${reg.english_level}\nSeat: ${seatDisplay}\nTicket ID: ${reg.ticket_id}`;
    
    // Create a temporary container
    const container = document.createElement('div');
    new QRCode(container, {
      text: qrText,
      width: 512,
      height: 512,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    // Wait a brief moment for the canvas to be rendered by qrcode.js
    setTimeout(() => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `MovieDay-QR-${reg.ticket_id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('QR Code ticket generated successfully!', 'success');
      } else {
        showToast('Failed to generate QR code.', 'error');
      }
    }, 100);
  } catch (err) {
    console.warn('QR Code generation failed:', err);
    showToast('Could not generate QR Code.', 'error');
  }
}

// ── Zoom Seating Map Controls ──────────────────────────────────
let currentScale = 1.0;
let isAutoFit = true;

function updateZoom() {
  const container = document.getElementById('seatMapScrollContainer');
  const wrapper = document.getElementById('seatMapWrapper');
  const inner = document.getElementById('seatMapInner');
  if (!container || !wrapper || !inner) return;

  // Clear transition and transform temporarily to get correct original dimensions
  const prevTransform = inner.style.transform;
  const prevTransition = inner.style.transition;
  
  inner.style.transition = 'none';
  inner.style.transform = 'none';

  // Read unscaled layout dimensions
  const origWidth = inner.offsetWidth || 1100;
  const origHeight = inner.offsetHeight || 600;

  // Restore transition
  inner.style.transition = prevTransition;

  const containerWidth = container.clientWidth;

  if (isAutoFit) {
    const padding = 16;
    const targetWidth = Math.max(200, containerWidth - padding * 2);
    currentScale = targetWidth / origWidth;
    
    // Don't scale up past 1.0 automatically in fit mode
    if (currentScale > 1.0) currentScale = 1.0;
    
    const fitBtn = document.getElementById('btnZoomFit');
    if (fitBtn) fitBtn.classList.add('active');
  } else {
    const fitBtn = document.getElementById('btnZoomFit');
    if (fitBtn) fitBtn.classList.remove('active');
  }

  // Enforce reasonable bounds
  if (currentScale < 0.2) currentScale = 0.2;
  if (currentScale > 2.0) currentScale = 2.0;

  // Apply new dimensions and scale transform
  inner.style.transform = `scale(${currentScale})`;
  wrapper.style.width = `${origWidth * currentScale}px`;
  wrapper.style.height = `${origHeight * currentScale}px`;

  // Update zoom display percentage label
  const zoomVal = document.getElementById('zoomLevelVal');
  if (zoomVal) zoomVal.textContent = `${Math.round(currentScale * 100)}%`;
}

function zoomIn() {
  isAutoFit = false;
  currentScale += 0.15;
  if (currentScale > 2.0) currentScale = 2.0;
  updateZoom();
}

function zoomOut() {
  isAutoFit = false;
  currentScale -= 0.15;
  if (currentScale < 0.2) currentScale = 0.2;
  updateZoom();
}

function toggleZoomFit() {
  isAutoFit = !isAutoFit;
  updateZoom();
}

// Automatically recalculate scale on window resize if autofit is active
window.addEventListener('resize', () => {
  if (isAutoFit) updateZoom();
});

// ── Drag to Scroll / Pan utility ────────────────────────────────
function initDragToScroll() {
  const container = document.getElementById('seatMapScrollContainer');
  if (!container || container.dataset.dragInit === 'true') return;
  container.dataset.dragInit = 'true';

  let isDown = false;
  let startX;
  let scrollLeft;

  container.addEventListener('mousedown', (e) => {
    // Only drag with left click and when map is scrollable
    if (e.button !== 0 || container.scrollWidth <= container.clientWidth) return;
    isDown = true;
    container.classList.add('active');
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.classList.remove('active');
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
    container.classList.remove('active');
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag sensitivity multiplier
    container.scrollLeft = scrollLeft - walk;
  });
}
