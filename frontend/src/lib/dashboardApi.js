const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://127.0.0.1:8000";
  }
}

export async function fetchBackendHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3200);
    const response = await fetch(`${getApiOrigin()}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export const sourceOptions = [
  { label: "All Sources", value: "" },
  { label: "Agoda", value: "agoda_json_import" },
  { label: "Booking", value: "booking_json_import" },
];

export const cityOptions = ["Nha Trang", "Hanoi", "Da Nang"];

export const sortOptions = [
  { label: "Most Reviews", value: "reviews_desc" },
  { label: "A-Z", value: "name_asc" },
  { label: "Availability", value: "availability_first" },
  { label: "Source", value: "source_asc" },
];

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const fallbackMonthlyRevenue = {
  monthLabel: "August 2017",
  totalRevenue: 3347905.38,
  averageAdr: 164.37,
  averageStayNights: 4.04,
  growthPercent: 18.6,
};

export const fallbackAlerts = [
  {
    bookingId: "DEMO-0001",
    guestName: "Promo Candidate 1",
    email: "promo1@example.com",
    roomType: "Room Type A",
    stayDates: "2026-05-02 to 2026-05-05",
    bookedPrice: 540,
    competitorPrice: 78.33,
    risk: "HIGH",
  },
  {
    bookingId: "DEMO-0002",
    guestName: "Promo Candidate 2",
    email: "promo2@example.com",
    roomType: "Room Type D",
    stayDates: "2026-05-08 to 2026-05-10",
    bookedPrice: 420,
    competitorPrice: 78.33,
    risk: "HIGH",
  },
];

export const fallbackInsight = {
  area_name: "Nha Trang",
  source: "agoda_json_import",
  hotels_analyzed: 8,
  reviews_analyzed: 19,
  praise_points: [
    "Nice view and scenery",
    "Breakfast quality",
    "Clean rooms and hygiene",
    "Good location and accessibility",
    "Friendly and helpful staff",
  ],
  complaint_points: [
    "Small room size",
    "Old facilities or outdated rooms",
    "Cleanliness concerns",
    "General service complaints",
  ],
  strategic_summary:
    "Competitors win on view, breakfast, and location, but guests still complain about room size, aging facilities, and inconsistent cleanliness.",
  model_used: "heuristic_fallback",
};

export const fallbackHotels = [
  {
    source: "agoda_json_import",
    hotel_name: "Truong Hai Hotel",
    search_area: "Nha Trang",
    availability_status: "unavailable",
    current_price: null,
    currency: null,
    hotel_url: "https://www.agoda.com/",
    review_count: 5,
    reviews: [
      {
        comment: "Room is very spacious for the price and it was clean.",
        reviewer: null,
        review_date: null,
      },
      {
        comment: "Hard to find the first time, but overall a good stay near the beach.",
        reviewer: null,
        review_date: null,
      },
    ],
  },
  {
    source: "booking_json_import",
    hotel_name: "Anna Belle Doi Rong Hotel",
    search_area: "Nha Trang",
    availability_status: "available",
    current_price: null,
    currency: null,
    hotel_url: "https://www.booking.com/",
    review_count: 3,
    reviews: [{ comment: "Guests like the view, but some mention service inconsistency." }],
  },
];

export const fallbackHotelIntelligence = {
  hotel: fallbackHotels[0],
  executive_summary:
    "This competitor wins on perceived value and location convenience, but guest feedback still exposes service consistency gaps that can be attacked with a cleaner, calmer stay promise.",
  strengths: ["Good location and accessibility", "Clean rooms and hygiene", "Spacious rooms"],
  weaknesses: ["Old facilities or outdated rooms", "General service complaints", "Small room size"],
  pricing_posture:
    "Use value-led positioning rather than chasing rate blindly. Compete on trust, smoother service, and clearer promise delivery.",
  service_gaps: [
    "Inconsistent guest service tone",
    "Occasional cleanliness concerns",
    "Weak first-arrival experience",
  ],
  positioning_opportunities: [
    "Promise a quieter and more dependable stay",
    "Lead with cleaner rooms and stronger service assurance",
    "Package experience benefits instead of discounting first",
  ],
  recommended_actions: [
    "Target high-risk guests with service-led retention offers",
    "Mirror competitor strengths in copy but stress consistency",
    "Use sales scripts focused on reliability and arrival comfort",
  ],
  marketing_hooks: [
    "Cleaner sleep, smoother stay",
    "Service you can count on from check-in to checkout",
    "More dependable comfort near the same area hotspots",
  ],
  model_used: "heuristic_fallback",
};

export const fallbackGuestAdvisor = {
  summary:
    "Recommend a mid-tier room with a value-led package and position the stay around cleaner execution, smoother arrival, and dependable support.",
  recommended_room_type: "Deluxe Room",
  recommended_price_anchor: "$145 per night",
  upsell_items: ["Breakfast add-on", "Airport transfer", "Late checkout"],
  sales_script:
    "For your stay, I would recommend our Deluxe Room because it gives better comfort without jumping too far on price. We can also bundle breakfast and late checkout so the overall value feels stronger than a room-only rate elsewhere.",
  objection_handling: [
    "If the guest says another hotel is cheaper, reposition around service reliability and cleaner execution.",
    "If the guest is unsure, offer one bundled perk before using a room discount.",
    "If the guest asks for reassurance, stress faster support and smoother arrival.",
  ],
  follow_up_questions: [
    "Are you prioritizing budget, comfort, or convenience?",
    "Would breakfast included help your decision?",
    "Do you need airport transfer or a late checkout option?",
  ],
  suggested_discount:
    "Start with a bundle upgrade, then use a light 5-8% closing incentive only if the guest still hesitates.",
  competitor_context:
    "Nearby competitors are often praised for location and breakfast, but complaints still focus on service consistency and room upkeep.",
  model_used: "heuristic_fallback",
};

export const fallbackLeadScore = {
  lead_score: 76,
  lead_temperature: "WARM",
  buyer_type: "balanced_value_buyer",
  close_probability: "Medium",
  upsell_priority: "Balanced",
  buying_signals: [
    "Guest mentions concrete stay needs",
    "Budget is still workable for a mid-tier room",
    "Multi-night stay increases value potential",
  ],
  blockers: ["Still comparing nearby rates"],
  recommended_upsells: ["Breakfast add-on", "Airport transfer", "Late checkout"],
  model_used: "heuristic_fallback",
};

export const fallbackPlaybook = {
  buyer_type: "balanced_value_buyer",
  journey_stage: "considering_options",
  opening_script:
    "I would recommend our Deluxe Room because it balances comfort and value better than simply chasing the cheapest nearby rate.",
  value_points: [
    "Lead with cleaner execution and more dependable service",
    "Frame the package around convenience, not only room rate",
    "Use one perk to make the offer feel stronger than OTA-only comparisons",
  ],
  upsell_strategy: [
    "Start with breakfast or transfer before a deeper room discount",
    "Upsell convenience first, then room category if interest stays strong",
    "Anchor value around a complete stay package",
  ],
  close_strategy: [
    "Ask a soft close question tied to convenience",
    "Reassure on service reliability if the guest compares price",
    "Use a light incentive only after value is established",
  ],
  follow_up_cadence:
    "Follow up within 1 hour, then again next morning with a concise value-led reminder.",
  script_variants: ["Value-led opening", "Trust-led reassurance", "Urgency-led close"],
  model_used: "heuristic_fallback",
};

export const fallbackChatMessages = [
  {
    role: "assistant",
    content:
      "Hello, I can help recommend the right room, build a package, and answer guest objections like a reservation agent.",
  },
];

export const fallbackCompetitorChatMessages = [
  {
    role: "assistant",
    content:
      "Ask about pricing pressure, review complaints, positioning gaps, or which competitor deserves the most attention in this market.",
  },
];

export function formatEnumLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function decodeEscapedNewlines(text) {
  return String(text || "")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

export function parseReviewPayload(review) {
  const rawComment = typeof review === "string" ? review : review?.comment ?? review;
  let commentText = "";
  let reviewerName =
    typeof review === "object" && review !== null
      ? review?.reviewer || review?.reviewer_name || null
      : null;
  let reviewLocation =
    typeof review === "object" && review !== null ? review?.location || null : null;

  if (rawComment && typeof rawComment === "object") {
    commentText = rawComment.review || rawComment.comment || JSON.stringify(rawComment);
    reviewerName = reviewerName || rawComment.reviewer_name || rawComment.reviewer || null;
    reviewLocation = reviewLocation || rawComment.location || null;
  } else {
    const stringComment = String(rawComment || "").trim();
    if (stringComment.startsWith("{") && /['"]review['"]\s*:/.test(stringComment)) {
      const reviewMatch = stringComment.match(
        /['"]review['"]\s*:\s*(["'])([\s\S]*?)\1\s*(?=,\s*['"](reviewer_name|reviewer|location)['"]|}$)/
      );
      const reviewerMatch = stringComment.match(/['"]reviewer_name['"]\s*:\s*(["'])([\s\S]*?)\1/);
      const locationMatch = stringComment.match(/['"]location['"]\s*:\s*(["'])([\s\S]*?)\1/);
      commentText = reviewMatch?.[2] || stringComment;
      reviewerName = reviewerName || reviewerMatch?.[2] || null;
      reviewLocation = reviewLocation || locationMatch?.[2] || null;
    } else {
      commentText = stringComment;
    }
  }

  return {
    commentText: decodeEscapedNewlines(commentText || "No comment provided."),
    reviewerName,
    reviewLocation,
  };
}

export async function consumeSseStream(response, onEvent) {
  if (!response.body) {
    throw new Error("Streaming body is not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventBlock of events) {
      const dataLine = eventBlock.split("\n").find((line) => line.startsWith("data: "));
      if (!dataLine) continue;
      onEvent(JSON.parse(dataLine.slice(6)));
    }
  }
}

export function normalizeUiErrorMessage(error, fallbackMessage) {
  const raw = String(error?.message || "").toLowerCase();
  if (raw.includes("failed to fetch")) {
    return "Không kết nối được tới backend. Kiểm tra xem FastAPI có đang chạy không.";
  }
  if (raw.includes("network")) {
    return "Kết nối mạng hoặc backend đang có vấn đề.";
  }
  return fallbackMessage;
}

export function normalizeStreamProviderError(event, fallbackMessage) {
  const detail = String(event?.detail || "").trim();
  const raw = detail.toLowerCase();

  if (raw.includes("groq api key is not configured")) {
    return "Groq API key chưa được cấu hình trong backend.";
  }
  if (raw.includes("401") || raw.includes("unauthorized")) {
    return "AI provider trả về 401 Unauthorized. Kiểm tra lại API key hoặc quyền truy cập model.";
  }
  if (raw.includes("timeout")) {
    return "AI provider bị timeout trước khi trả lời.";
  }
  if (raw.includes("connection")) {
    return "Không kết nối được tới AI provider. Kiểm tra base URL hoặc trạng thái service.";
  }
  if (detail) {
    return `Lỗi AI provider: ${detail}`;
  }
  return fallbackMessage;
}

export function classifyCommentTone(comment) {
  const praiseKeywords = ["clean", "friendly", "location", "view", "breakfast", "spacious", "quiet", "good"];
  const complaintKeywords = ["noisy", "mosquito", "small", "hard", "annoy", "old", "dirty", "bad"];
  const lowered = (comment || "").toLowerCase();
  if (complaintKeywords.some((keyword) => lowered.includes(keyword))) return "complaint";
  if (praiseKeywords.some((keyword) => lowered.includes(keyword))) return "praise";
  return "neutral";
}

async function jsonRequest(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Request failed: ${path}`);
  return response.json();
}

export async function fetchDashboard() {
  const response = await fetch(`${API_BASE_URL}/dashboard`);
  if (!response.ok) throw new Error("Failed to load dashboard.");
  const payload = await response.json();
  return {
    monthlyRevenue: {
      monthLabel: payload.monthly_revenue.month_label,
      totalRevenue: Number(payload.monthly_revenue.total_revenue),
      averageAdr: Number(payload.monthly_revenue.average_adr),
      averageStayNights: Number(payload.monthly_revenue.average_stay_nights),
      growthPercent: Number(payload.monthly_revenue.growth_percent),
    },
    alerts: payload.alerts.map((item) => ({
      bookingId: item.booking_id,
      guestName: item.guest_name,
      email: item.guest_email,
      roomType: item.room_type,
      stayDates: item.stay_dates,
      bookedPrice: Number(item.booked_price),
      competitorPrice: item.competitor_price ? Number(item.competitor_price) : null,
      risk: item.risk,
    })),
  };
}

export const fetchCompetitorInsights = (payload) => jsonRequest("/ai/competitor-insights", payload);
export const fetchCompetitorHotels = (payload) => jsonRequest("/ai/competitor-hotels", payload);
export const fetchCompetitorHotelIntelligence = (payload) =>
  jsonRequest("/ai/competitor-hotel-intelligence", payload);
export const fetchGuestAdvisor = (payload) => jsonRequest("/ai/guest-advisor", payload);
export const fetchLeadScoring = (payload) => jsonRequest("/ai/lead-scoring", payload);
export const fetchConversionPlaybook = (payload) => jsonRequest("/ai/conversion-playbook", payload);
export const fetchPromoEmail = (payload) => jsonRequest("/marketing/generate-promo-email", payload);

export function buildGuestRequest({ areaName, source, customerName, customerMessage, partySize, nights, budget, travelIntent }) {
  return {
    area_name: areaName,
    source: source || null,
    customer_name: customerName || null,
    customer_message: customerMessage,
    party_size: Number(partySize) || 2,
    nights: Number(nights) || 2,
    budget: budget === "" || budget == null ? null : Number(budget),
    travel_intent: travelIntent,
  };
}
