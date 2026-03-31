import { notifyPayment, verifyTicket, waiveTicket } from "./apiService.js";

// Scanner instance holder
let html5QrCode = null;
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

// Scanner modal control
async function openScanner() {
  if (isScannerOpen) return;
  const container = document.getElementById('reader-container');
  const reader = document.getElementById('reader');
  if (!container || !reader) {
    console.error('openScanner: faltan elementos #reader-container o #reader');
    return;
  }

  console.log('Iniciando escáner...');

  // Mostrar modal antes de iniciar la librería (no debe estar display:none)
  container.style.display = 'flex';
  container.setAttribute('aria-hidden', 'false');
  isScannerOpen = true;

  // esperar un frame para que el layout se pinte
  await new Promise((r) => setTimeout(r, 200));

  const Html5Qrcode = window.Html5Qrcode;
  if (!Html5Qrcode) {
    console.error('Html5Qrcode library not loaded');
    // ocultar modal
    container.style.display = 'none';
    container.setAttribute('aria-hidden', 'true');
    isScannerOpen = false;
    return;
  }

  // limpiar instancia previa si existe
  if (html5QrCode) {
    try { await html5QrCode.stop(); } catch (e) { /* noop */ }
    try { html5QrCode.clear(); } catch (e) { /* noop */ }
    html5QrCode = null;
  }

  // instantiate
  html5QrCode = new Html5Qrcode('reader');

  const config = { fps: 10, qrbox: { width: 300, height: 200 } };

  // Try strict environment facing first
  try {
    await html5QrCode.start({ facingMode: { exact: 'environment' } }, config,
      async (decodedText, decodedResult) => {
        console.log('Código detectado:', decodedText);
        try { await html5QrCode.stop(); } catch (_) {}
        try { html5QrCode.clear(); } catch (_) {}
        html5QrCode = null;
        closeScanner();
        if (elements.ticketInput) {
          elements.ticketInput.value = decodedText;
        }
        if (typeof handleVerify === 'function') handleVerify();
      },
      (errorMessage) => {
        // non-fatal decode errors
        console.log('Scan error (info):', errorMessage);
      }
    );
    console.log('Escáner iniciado (facingMode exact).');
    return;
  } catch (err) {
    console.error('Error iniciando con facingMode exact:', err);
    // fallback: try environment without exact
  }

  try {
    // fallback attempt
    html5QrCode = new Html5Qrcode('reader');
    await html5QrCode.start({ facingMode: 'environment' }, config,
      async (decodedText) => {
        console.log('Código detectado (fallback):', decodedText);
        try { await html5QrCode.stop(); } catch (_) {}
        try { html5QrCode.clear(); } catch (_) {}
        html5QrCode = null;
        closeScanner();
        if (elements.ticketInput) elements.ticketInput.value = decodedText;
        if (typeof handleVerify === 'function') handleVerify();
      },
      (errMsg) => console.log('Scan error (fallback):', errMsg)
    );
    console.log('Escáner iniciado (facingMode fallback).');
  } catch (err2) {
    console.error('No fue posible iniciar la cámara:', err2);
    // ocultar modal si no se puede iniciar
    container.style.display = 'none';
    container.setAttribute('aria-hidden', 'true');
    isScannerOpen = false;
    if (html5QrCode) {
      try { html5QrCode.clear(); } catch (_) {}
      html5QrCode = null;
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
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return amount || "-";
  }

  return value.toLocaleString("es-VE", {
    style: "currency",
    currency: "VES"
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  // Try parsing common formats (ISO or 'YYYY-MM-DD HH:MM:SS')
  let parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    parsed = new Date(String(dateValue).replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) {
      return String(dateValue);
    }
  }

  const pad = (n) => String(n).padStart(2, "0");
  const day = pad(parsed.getDate());
  const month = pad(parsed.getMonth() + 1);
  const year = parsed.getFullYear();

  let hours = parsed.getHours();
  const minutes = pad(parsed.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
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

async function handleVerify() {
  const code = elements.ticketInput.value.trim();
  if (!code) {
    showStatus("Ingresa un codigo de ticket.", "error");
    clearScreen();
    return;
  }

  state.ticketCode = code;
  setBusy(true);
  showStatus("Verificando ticket...", "info");
  clearScreen();

  try {
    const payload = await verifyTicket(code);
    if (payload.status === "invalid") {
      showStatus(getApiErrorMessage(payload, "Ticket invalido."), "error");
      return;
    }

    updateResult(payload);
    setMessage("Ticket verificado correctamente.", "success", Boolean(payload && payload.isMock));
  } catch (error) {
    showStatus(error.message || "No se pudo verificar el ticket.", "error");
  } finally {
    setBusy(false);
  }
}

async function handleAction(action) {
  if (!state.ticketCode) {
    showStatus("Primero verifica un ticket.", "error");
    return;
  }

  const actionLabel = action === "pay" ? "Registrando pago..." : "Exonerando ticket...";
  const actionRequest = action === "pay" ? notifyPayment : waiveTicket;
  const successMessage = action === "pay" ? "Pago registrado" : "Ticket exonerado";

  setBusy(true);
  showStatus(actionLabel, "info");

  try {
    const payload = await actionRequest(state.ticketCode);
    if (payload.status === "invalid") {
      showStatus(getApiErrorMessage(payload, "Operacion invalida."), "error");
      return;
    }

    setMessage(payload.message || successMessage, "success", Boolean(payload && payload.isMock));
    elements.ticketInput.value = "";
    state.ticketCode = "";
    clearScreen();
    elements.ticketInput.focus();
  } catch (error) {
    setMessage(error.message || "No se pudo completar la operacion.", "error");
  } finally {
    setBusy(false);
  }
}

function registerEvents() {
  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleVerify();
  });

  elements.payButton.addEventListener("click", async () => {
    await handleAction("pay");
  });

  elements.waiveButton.addEventListener("click", async () => {
    await handleAction("waive");
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
