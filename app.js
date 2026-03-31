import { notifyPayment, verifyTicket, waiveTicket } from "./apiService.js";

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

function clearResult() {
  state.ticketData = null;
  elements.resultCode.textContent = "-";
  elements.resultAmount.textContent = "-";
  elements.resultEnterDate.textContent = "-";
  elements.resultPanel.hidden = true;
  elements.payButton.disabled = true;
  elements.waiveButton.disabled = true;
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

  return value.toLocaleString("es-PA", {
    style: "currency",
    currency: "USD"
  });
}

function formatDate(dateValue) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue || "-";
  }
  return parsed.toLocaleString("es-PA");
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
    clearResult();
    return;
  }

  state.ticketCode = code;
  setBusy(true);
  showStatus("Verificando ticket...", "info");
  clearResult();

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
    clearResult();
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
  clearResult();
  showStatus("Listo para consultar un ticket.", "info");
  registerEvents();
  registerServiceWorker();
  elements.ticketInput.focus();
}

init();
