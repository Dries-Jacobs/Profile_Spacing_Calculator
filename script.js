(function () {
  // ------- DOM -------
  const form = document.getElementById('calcForm');
  const resetBtn = document.getElementById('resetBtn');
  const inputTotWid = document.getElementById('inputTotWid');
  const inputProWid = document.getElementById('inputProWid');
  const inputDesSpa = document.getElementById('inputDesSpa');
  const result1El = document.getElementById('calcSpa');
  const result2El = document.getElementById('nPro');

  const drawer = document.getElementById('historyDrawer');
  const scrim = document.getElementById('drawerScrim');
  const handle = document.getElementById('drawerHandle');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // ------- Helpers -------
  const toNumber = (val) => {
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : 0;
  };
  const fmt = (v) => Number(v).toFixed(2);
  const fmt0 = (v) => Number(v).toFixed(0);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  // ------- Calculation -------
  function calculate() {
    const a = toNumber(inputTotWid.value);
    const b = toNumber(inputProWid.value);
    const c = toNumber(inputDesSpa.value);

    const num = Math.round(((a - b) / (b + c)) + 1); // number of profiles
    let calcSpa = 0;
    if (num > 1) {
      calcSpa = ((a - b) / (num - 1)) - b; // spacing between profiles
    }

    // Update UI
    result1El.textContent = Number.isFinite(calcSpa) ? `${fmt(calcSpa)} mm` : '-';
    result2El.textContent = Number.isFinite(num) ? fmt0(num) : '-';

    return { a, b, c, num, calcSpa };
  }

  function resetAll() {
    inputTotWid.value = '';
    inputProWid.value = '';
    inputDesSpa.value = '';
    result1El.textContent = '-';
    result2El.textContent = '-';
    inputTotWid.focus();
  }

  // ------- History -------
  const LS_KEY = 'spacing_calc_history_v1';
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }

  function renderHistory() {
    if (!history.length) {
      historyList.innerHTML = `<li class="empty">No calculations yet</li>`;
      return;
    }
    historyList.innerHTML = history
      .map((h) => {
        const dt = new Date(h.ts);
        const stamp = dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
        return `
          <li class="history-item">
            <div class="row1">
              <time datetime="${dt.toISOString()}">${stamp}</time>
              <span class="tag"># Profiles: ${fmt0(h.num)}</span>
            </div>
            <div class="row2">
              A: ${fmt(h.a)} · B: ${fmt(h.b)} · C: ${fmt(h.c)} → 
              <strong>Spacing: ${fmt(h.calcSpa)} mm</strong>
            </div>
          </li>`;
      })
      .join('');
  }

  function addHistory(entry) {
    // Only add if numbers are valid and positive-ish
    if (!Number.isFinite(entry.num) || entry.num <= 0) return;
    if (!Number.isFinite(entry.calcSpa)) return;

    history.unshift({ ...entry, ts: Date.now() });
    // keep last 100
    history = history.slice(0, 100);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
    renderHistory();
  }

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    try { localStorage.removeItem(LS_KEY); } catch {}
    renderHistory();
  });

  // ------- Drawer (Bottom Sheet) -------
  let startY = 0;
  let startTranslate = 0;
  let currentTranslate = 0;
  const PEEK = 68; // should match --peek-height
  let closedY = 0; // computed after layout

  function computeClosedY() {
    closedY = drawer.getBoundingClientRect().height - PEEK;
    closedY = Math.max(0, closedY);
  }

  // Initialize drawer closed
  function setTranslate(y, animate = true) {
    currentTranslate = clamp(y, 0, closedY);
    drawer.style.transform = `translateY(${currentTranslate}px)`;
    drawer.classList.toggle('dragging', !animate);
    // scrim opacity based on openness
    const openness = closedY === 0 ? 0 : 1 - currentTranslate / closedY;
    scrim.style.opacity = (0.45 * openness).toFixed(3);
    scrim.classList.toggle('visible', openness > 0.02);
  }

  function isOpen() {
    return currentTranslate <= 2;
  }
  function openDrawer() {
    drawer.setAttribute('aria-hidden', 'false');
    setTranslate(0, true);
  }
  function closeDrawer() {
    drawer.setAttribute('aria-hidden', 'true');
    setTranslate(closedY, true);
  }
  function toggleDrawer() {
    isOpen() ? closeDrawer() : openDrawer();
  }

  // Drag handlers (pointer events unify mouse + touch)
  function onPointerDown(e) {
    // Only start drag from the header/handle
    if (!e.target.closest('#drawerHandle')) return;

    drawer.classList.add('dragging');
    startY = e.clientY;
    startTranslate = currentTranslate;
    handle.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e) {
    if (!drawer.classList.contains('dragging')) return;
    const delta = e.clientY - startY;
    setTranslate(startTranslate + delta, false);
  }
  function onPointerUp(e) {
    if (!drawer.classList.contains('dragging')) return;
    drawer.classList.remove('dragging');

    // Threshold to open: must pull up at least 35% of travel or 120px, whichever is smaller
    const THRESHOLD = Math.min(120, closedY * 0.35);

    // Decide final state based on where we ended
    if (currentTranslate < closedY - THRESHOLD) {
      openDrawer();
    } else {
      closeDrawer();
    }

    handle.releasePointerCapture?.(e.pointerId);
  }

  // Clicks
  handle.addEventListener('click', (e) => {
    // ignore click if it was part of a drag (dragging class removed in onPointerUp)
    if (!drawer.classList.contains('dragging')) toggleDrawer();
  });

  // Backdrop click closes
  scrim.addEventListener('click', closeDrawer);

  // Pointer events
  handle.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // Recompute positions on resize (orientation change, etc.)
  window.addEventListener('resize', () => {
    const wasOpen = isOpen();
    computeClosedY();
    setTranslate(wasOpen ? 0 : closedY, false);
  });

  // ------- Wire up form -------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = calculate();
    addHistory(r);
    // Optional: uncomment if you want it to auto-open on each calculation
    // openDrawer();
  });

  resetBtn.addEventListener('click', resetAll);

  // Optional live preview WITHOUT logging to history:
  [inputTotWid, inputProWid, inputDesSpa].forEach((inp) =>
    inp.addEventListener('input', () => {
      calculate();
    })
  );

  // ------- Initial load -------
  // Render existing history and set initial drawer position
  renderHistory();
  // Let layout settle then compute closed position
  requestAnimationFrame(() => {
    computeClosedY();
    setTranslate(closedY, false);
  });
})();