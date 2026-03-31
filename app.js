import { notifyPayment, verifyTicket as apiVerifyTicket, waiveTicket as apiWaiveTicket } from "./apiService.js";

// Scanner instance holder
let html5QrScanner = null;
let isScannerOpen = false;

const state = {
  ticketCode: "",
  ticketData: null,
  busy: false
};

const elements = {
  form: document.getElementById("ticket-form"),
  ticketInput: document.getElementById("ticket-code"),
  verifyButton: document.getElementById("verify-button"),
  payButton: document.getElementById("pay-button"),
  waiveButton: document.getElementById("waive-button"),
  statusBox: document.getElementById("status-box"),
  resultPanel: document.getElementById("result-panel"),
  resultCode: document.getElementById("result-code"),
  resultAmount: document.getElementById("result-amount"),
  resultEnterDate: document.getElementById("result-enter-date")
};

function setBusy(isBusy) {
  state.busy = isBusy;
  elements.verifyButton.disabled = isBusy;
  elements.payButton.disabled = isBusy || !state.ticketData;
  elements.waiveButton.disabled = isBusy || !state.ticketData;
  elements.ticketInput.disabled = isBusy;
}

// Clears UI result fields and resets state safely.
function clearResult() {
  state.ticketData = null;
  elements.resultCode.textContent = "-";
  elements.resultAmount.textContent = "-";
  elements.resultEnterDate.textContent = "-";
  elements.resultPanel.hidden = true;
  elements.payButton.disabled = true;
  elements.waiveButton.disabled = true;
}

// New: comprehensive clear for screen/UI. Use this before updating with new data.
function clearScreen() {
  try {
    // Clear input
    if (elements.ticketInput) elements.ticketInput.value = "";

    // Clear result region
    clearResult();

    // Clear status
    showStatus("Listo para consultar un ticket.", "info");
  } catch (err) {
    // Defensive: ensure errors here don't bubble up
    console.warn('clearScreen error', err);
  }
}

// Alias for Spanish name as requested
function limpiarPantalla() {
  clearScreen();
}

// Scanner modal control using Html5QrcodeScanner
async function openScanner() {
  if (isScannerOpen) return;
  const container = document.getElementById('reader-container');
  const reader = document.getElementById('reader');
  const readerLog = document.getElementById('reader-log');
  if (!container || !reader) {
    console.error('openScanner: faltan elementos #reader-container o #reader');
    if (readerLog) readerLog.textContent = 'Error: elementos del lector no encontrados.';
    return;
  }

  console.log('Iniciando escáner...');
  if (readerLog) readerLog.textContent = 'Iniciando escáner...';

  // Mostrar modal antes de iniciar la librería (el reader debe ser visible)
  container.style.display = 'flex';
  container.setAttribute('aria-hidden', 'false');
  // ensure reader is visible
  reader.style.display = 'block';
  isScannerOpen = true;

  // wait briefly for layout to render
  await new Promise((r) => setTimeout(r, 250));

  const Html5QrcodeScanner = window.Html5QrcodeScanner;
  if (!Html5QrcodeScanner) {
    const msg = 'Html5QrcodeScanner library not loaded';
    console.error(msg);
    if (readerLog) readerLog.textContent = msg;
    container.style.display = 'none';
    container.setAttribute('aria-hidden', 'true');
    isScannerOpen = false;
    return;
  }

  // If an existing scanner exists, clear it to avoid duplicate UI causing blink
  if (html5QrScanner) {
    try {
      await html5QrScanner.clear();
    } catch (e) {
      console.warn('Error clearing existing scanner:', e);
    }
    html5QrScanner = null;
  }

  try {
    // Create a new scanner. verbose:false, fps:10, qrbox:250
    html5QrScanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250, verbose: false }, false);

    // render with callbacks
    html5QrScanner.render(
      (decodedText, decodedResult) => {
        console.log('Código detectado:', decodedText, decodedResult);
        if (readerLog) readerLog.textContent = `Código detectado: ${decodedText}`;
        // clear and close
        html5QrScanner.clear().catch(() => {});
        html5QrScanner = null;
        closeScanner();
        if (elements.ticketInput) {
          elements.ticketInput.value = decodedText;
          elements.ticketInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (typeof verifyTicket === 'function') verifyTicket();
      },
      (errorMessage) => {
        // non-fatal decode errors
        console.log('Scan error (info):', errorMessage);
        if (readerLog) readerLog.textContent = `Scan: ${errorMessage}`;
      }
    );

    console.log('Escáner renderizado correctamente.');
    if (readerLog) readerLog.textContent = 'Escáner listo. Apunta al código.';
  } catch (err) {
    console.error('Error inicializando Html5QrcodeScanner:', err);
    if (readerLog) readerLog.textContent = `Error inicializando cámara: ${err && err.message ? err.message : err}`;
    // hide modal on fatal error
    container.style.display = 'none';
    container.setAttribute('aria-hidden', 'true');
    isScannerOpen = false;
    if (html5QrScanner) {
      try { html5QrScanner.clear(); } catch (_) {}
      html5QrScanner = null;
    }
  }
}

function closeScanner() {
  const container = document.getElementById('reader-container');
  if (container) {
    container.style.display = 'none';
    container.setAttribute('aria-hidden', 'true');
  }
  isScannerOpen = false;
  if (html5QrCode) {
    // ensure stopped
    html5QrCode.stop().catch(()=>{}).finally(()=>{ html5QrCode.clear(); html5QrCode = null; });
  }
}

function showStatus(message, type = "info") {
  elements.statusBox.textContent = message;
  elements.statusBox.className = `status-box ${type}`;
}
function setMessage(message, type = "info", isMock = false) {
  const note = isMock ? " — usando datos de respaldo (mock)" : "";
  showStatus(message + note, type);
}

function formatAmount(amount) {
  // Always display as: Bs.S 420,00 (use comma as decimal separator)
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount || "-";
  // Format with 2 decimals and comma decimal separator
  const parts = value.toFixed(2).split('.');
  // Add thousands separator for readability
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Bs.S ${parts[0]},${parts[1]}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  // Accept ISO or 'YYYY-MM-DD HH:MM:SS' formats. Normalize by inserting T if necessary.
  let parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    parsed = new Date(String(dateValue).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) {
      // Try parsing manually for 'YYYY-MM-DD HH:MM:SS'
      const m = String(dateValue).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
      if (m) {
        const [, y, mo, d, hh, mm] = m;
        parsed = new Date(`${y}-${mo}-${d}T${hh}:${mm}:00`);
      }
      if (Number.isNaN(parsed.getTime())) return String(dateValue);
    }
  }

  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(parsed.getDate());
  const month = pad(parsed.getMonth() + 1);
  const year = parsed.getFullYear();

  let hours = parsed.getHours();
  const minutes = pad(parsed.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12; if (hours === 0) hours = 12;
  const hoursStr = pad(hours);

  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
}

function updateResult(ticketData) {
  state.ticketData = ticketData;
  elements.resultCode.textContent = state.ticketCode;
  elements.resultAmount.textContent = formatAmount(ticketData.amount);
  elements.resultEnterDate.textContent = formatDate(ticketData.enter_date);
  elements.resultPanel.hidden = false;
  elements.payButton.disabled = false;
  elements.waiveButton.disabled = false;
}

function getApiErrorMessage(payload, fallback) {
  if (!payload || payload.status !== "invalid") {
    return fallback;
  }
  return payload.error || fallback;
}
// Show mock/demo data and update UI
// Show mock/demo data; amount and date can be provided, otherwise generated
function showMockData({ amount = null, enter_date = null } = {}) {
  console.warn('--- MODO DEMO ACTIVO: Usando datos de respaldo ---');

  const inputVal = (elements.ticketInput && elements.ticketInput.value.trim()) || '9951053972583903924337';
  state.ticketCode = inputVal;

  // Generate random amount between 150.00 and 600.00 if not provided
  let amountVal;
  if (amount != null) {
    amountVal = Number(amount);
  } else {
    const min = 15000; // cents
    const max = 60000;
    const cents = Math.floor(Math.random() * (max - min + 1)) + min;
    amountVal = cents / 100;
  }

  // Use provided date or current system date/time
  const dateVal = enter_date || new Date();

  const mock = {
    status: 'valid',
    amount: Number(amountVal).toFixed(2),
    enter_date: dateVal,
    isMock: true
  };

  // Update UI
  if (elements.ticketInput) elements.ticketInput.value = inputVal;
  updateResult(mock);

  // Add a small green badge in result panel
  let badge = document.getElementById('demo-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'demo-badge';
    badge.style.cssText = 'margin-top:8px;padding:6px 10px;border-radius:999px;background:#e6f7ec;color:#166534;font-weight:700;font-size:0.85rem;display:inline-block';
    elements.resultPanel.appendChild(badge);
  }
  badge.textContent = 'Verificado (Modo Demo)';

  // Status message
  setMessage('Ticket verificado correctamente.', 'success', true);
}

// App-level verifyTicket: attempts real API then falls back to demo mock with dynamic amount/date
async function verifyTicket() {
  const code = elements.ticketInput.value.trim();
  if (!code) {
    showStatus('Ingresa un codigo de ticket.', 'error');
    clearScreen();
    return;
  }

  state.ticketCode = code;
  setBusy(true);
  showStatus('Verificando ticket...', 'info');
  clearScreen();

  try {
    // Call API function imported as apiVerifyTicket
    const payload = await apiVerifyTicket(code);

    // If API returns falsy or indicates invalid, use mock
    if (!payload || payload.status === 'invalid') {
      console.warn('API returned invalid or empty payload; switching to demo mock');
      showMockData();
      return;
    }

    // Normalize enter_date to Date/formatted string
    const normalized = Object.assign({}, payload);
    if (normalized.enter_date) normalized.enter_date = formatDate(normalized.enter_date);

    updateResult(normalized);
    setMessage('Ticket verificado correctamente.', 'success', Boolean(normalized && normalized.isMock));
  } catch (err) {
    // Network/CORS/error -> use dynamic mock
    console.warn('Error contacting API, activating demo mock. Error:', err);
    // Use current date and random amount
    showMockData({ amount: null, enter_date: new Date() });
  } finally {
    setBusy(false);
  }
}

// procesarPago: mock flow for Pay button
function procesarPago() {
  if (!state.ticketCode) {
    showStatus('Primero verifica un ticket.', 'error');
    return;
  }

  const amount = state.ticketData && state.ticketData.amount ? state.ticketData.amount : (elements.resultAmount ? elements.resultAmount.textContent : null);
  const displayAmount = amount ? formatAmount(Number(String(amount).replace(',', '.'))) : 'Bs.S 0,00';

  // Show processing message (green)
  showStatus(`Procesando pago de ${displayAmount}...`, 'info');

  // Simulate processing
  setTimeout(() => {
    showStatus('✅ ¡Pago Exitoso! Ticket validado para salida.', 'success');

    // After 3 seconds clear UI for next customer
    setTimeout(() => {
      clearScreen();
      elements.ticketInput.focus();
      state.ticketCode = '';
      state.ticketData = null;
    }, 3000);
  }, 2000);
}

// exonerarTicket: mock flow for Waive button
function exonerarTicket() {
  if (!state.ticketCode) {
    showStatus('Primero verifica un ticket.', 'error');
    return;
  }

  showStatus('Aplicando cortesía de Cines Unidos...', 'info');

  setTimeout(() => {
    // Update UI: set amount to 0.00
    const mock = {
      status: 'valid',
      amount: '0.00',
      enter_date: new Date(),
      isMock: true
    };
    updateResult(mock);
    showStatus('🎟️ Ticket Exonerado exitosamente.', 'success');
  }, 1500);
}

function registerEvents() {
  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await verifyTicket();
  });

  elements.payButton.addEventListener("click", () => {
    procesarPago();
  });

  elements.waiveButton.addEventListener("click", () => {
    exonerarTicket();
  });
}

// Wire camera button and modal close
function registerScannerEvents() {
  const camBtn = document.getElementById('camera-button');
  if (camBtn) camBtn.addEventListener('click', () => { limpiarPantalla(); openScanner(); });
  const readerClose = document.getElementById('reader-close');
  if (readerClose) readerClose.addEventListener('click', () => { closeScanner(); });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch {
    showStatus("La app funciona, pero el modo offline no pudo activarse.", "error");
  }
}

function init() {
  clearScreen();
  registerEvents();
  registerScannerEvents();
  registerServiceWorker();
  elements.ticketInput.focus();
}

init();
