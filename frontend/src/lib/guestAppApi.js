import { API_BASE_URL } from "./dashboardApi";

const LS_BOOKING_REF = "guest_app_booking_ref";
export const DEFAULT_GUEST_APP_BOOKING_REF = "ORT-2026-0003";

export function loadGuestBookingRef() {
  try {
    const v = window.localStorage.getItem(LS_BOOKING_REF);
    return (v && v.trim()) || DEFAULT_GUEST_APP_BOOKING_REF;
  } catch {
    return DEFAULT_GUEST_APP_BOOKING_REF;
  }
}

export function saveGuestBookingRef(ref) {
  try {
    window.localStorage.setItem(LS_BOOKING_REF, (ref || "").trim());
  } catch {
    /* ignore */
  }
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function guestAppSession(bookingRef, signal) {
  const q = new URLSearchParams({ booking_ref: bookingRef.trim() });
  const response = await fetch(`${API_BASE_URL}/guest-app/session?${q}`, { signal });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

/** JSON reply (non-streaming); prefer {@link guestAppConciergeChatStream} in the guest UI. */
export async function guestAppConciergeChat({ booking_ref, message, history }, signal) {
  const response = await fetch(`${API_BASE_URL}/guest-app/concierge-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      booking_ref: booking_ref.trim(),
      message,
      history: (history || []).map((m) => ({ role: m.role, content: m.content })),
    }),
    ...(signal ? { signal } : {}),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

/** POST opens an SSE stream: events `meta`, `model`, `chunk`, optional `error`, then `done`. */
export async function guestAppConciergeChatStream({ booking_ref, message, history }, signal) {
  return fetch(`${API_BASE_URL}/guest-app/concierge-chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      booking_ref: booking_ref.trim(),
      message,
      history: (history || []).map((m) => ({ role: m.role, content: m.content })),
    }),
    ...(signal ? { signal } : {}),
  });
}

export async function guestAppOffers(bookingRef, signal) {
  const q = new URLSearchParams({ booking_ref: bookingRef.trim() });
  const response = await fetch(`${API_BASE_URL}/guest-app/offers?${q}`, { signal });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppRoomBoard(propertyId = 1, signal) {
  const q = new URLSearchParams({ property_id: String(propertyId) });
  const response = await fetch(`${API_BASE_URL}/guest-app/rooms/board?${q}`, { signal });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppTimelineStep(bookingRef, step) {
  const response = await fetch(`${API_BASE_URL}/guest-app/timeline/step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_ref: bookingRef.trim(), step }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppDiningRequest(payload) {
  const response = await fetch(`${API_BASE_URL}/guest-app/dining-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppHousekeepingRequest(payload) {
  const response = await fetch(`${API_BASE_URL}/guest-app/housekeeping-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export function guestAppBillExportUrl(bookingRef) {
  const q = new URLSearchParams({ booking_ref: bookingRef.trim() });
  return `${API_BASE_URL}/guest-app/bill-export?${q}`;
}

/** Add a folio line (minibar / dining / …); updates bill totals. */
export async function guestAppAddFolioLine({ booking_ref, category, description, amount }) {
  const response = await fetch(`${API_BASE_URL}/guest-app/folio-line`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      booking_ref: booking_ref.trim(),
      category: category || "dining",
      description,
      amount: typeof amount === "number" ? amount.toFixed(2) : String(amount),
    }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppSubmitNps({ booking_ref, stars, comment }) {
  const response = await fetch(`${API_BASE_URL}/guest-app/nps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      booking_ref: booking_ref.trim(),
      stars,
      comment: comment?.trim() || null,
    }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

/** Anonymous — no booking required. */
export async function guestAppAnonymousFeedback({ message, area_name }) {
  const response = await fetch(`${API_BASE_URL}/guest-app/feedback-anonymous`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message.trim(),
      area_name: area_name?.trim() || null,
    }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppFirstTimerGuide(bookingRef, signal) {
  const q = new URLSearchParams({ booking_ref: bookingRef.trim() });
  const response = await fetch(`${API_BASE_URL}/guest-app/first-timer-guide?${q}`, { signal });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppTimeUpsells(signal) {
  const response = await fetch(`${API_BASE_URL}/guest-app/time-upsells`, { signal });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppPricingScenarios(signal) {
  const response = await fetch(`${API_BASE_URL}/guest-app/pricing-scenarios`, { signal });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppVouchers(signal) {
  const response = await fetch(`${API_BASE_URL}/guest-app/vouchers`, { signal });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppRedeemVoucher({ booking_ref, code }) {
  const response = await fetch(`${API_BASE_URL}/guest-app/voucher/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_ref: booking_ref.trim(), code: code.trim() }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function guestAppBookingInquiry(payload) {
  const response = await fetch(`${API_BASE_URL}/guest-app/booking-inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

/** Optional booking_ref — omit or null for anonymous screen analytics. */
export async function guestAppLogAnalytics({ event_key, booking_ref, duration_ms }) {
  const body = {
    event_key,
    duration_ms: duration_ms ?? null,
    booking_ref: booking_ref && String(booking_ref).trim().length >= 3 ? String(booking_ref).trim() : null,
  };
  const response = await fetch(`${API_BASE_URL}/guest-app/analytics/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const detail = data?.detail || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}
