// Configuration
const API_BASE_URL = "https://esta7.com/ticket";
const AUTH_HEADER = "Basic cHJ1ZWJhOnBydWViYQ==";

function formatDateForUI(dateValue) {
  if (!dateValue) return "-";
  let parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    parsed = new Date(String(dateValue).replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return String(dateValue);
  }
  const pad = (n) => String(n).padStart(2, "0");
  const day = pad(parsed.getDate());
  const month = pad(parsed.getMonth() + 1);
  const year = parsed.getFullYear();
  let hours = parsed.getHours();
  const minutes = pad(parsed.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12; if (hours === 0) hours = 12;
  const hoursStr = pad(hours);
  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
}

async function safeFetchJson(url) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", AUTH_HEADER);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  const response = await fetch(url, requestOptions);
  return response;
}

export async function verifyTicket(code) {
  const url = `${API_BASE_URL}/verify/${encodeURIComponent(code)}`;
  try {
    const response = await safeFetchJson(url);
    if (response.ok) {
      const payload = await response.json();
      if (payload && payload.enter_date) payload.enter_date = formatDateForUI(payload.enter_date);
      return payload;
    }

    try {
      const payload = await response.json();
      if (payload && payload.enter_date) payload.enter_date = formatDateForUI(payload.enter_date);
      return payload;
    } catch {
      return { status: "invalid", error: `HTTP ${response.status}` };
    }
  } catch (err) {
    console.warn("Error en API Real, usando datos de respaldo.", err);
    return { status: "valid", amount: "420.00", enter_date: formatDateForUI("2026-03-31T10:50:00"), isMock: true };
  }
}

export async function notifyPayment(code) {
  const url = `${API_BASE_URL}/notify/${encodeURIComponent(code)}`;
  try {
    const response = await safeFetchJson(url);
    if (response.ok) {
      const payload = await response.json();
      return payload;
    }
    try { return await response.json(); } catch { return { status: "invalid", error: `HTTP ${response.status}` }; }
  } catch (err) {
    console.warn("Error en API Real (notify), usando datos de respaldo.", err);
    return { status: "valid", code: "9912615352978036108721", isMock: true };
  }
}

export async function waiveTicket(code) {
  const url = `${API_BASE_URL}/waive/${encodeURIComponent(code)}`;
  try {
    const response = await safeFetchJson(url);
    if (response.ok) {
      const payload = await response.json();
      return payload;
    }
    try { return await response.json(); } catch { return { status: "invalid", error: `HTTP ${response.status}` }; }
  } catch (err) {
    console.warn("Error en API Real (waive), usando datos de respaldo.", err);
    return { status: "valid", isMock: true };
  }
}
