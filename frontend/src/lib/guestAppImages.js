/** Guest app imagery via Picsum (seeded) — avoids broken Unsplash photo IDs in production. */

const P = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const guestAppImages = {
  heroLobby: P("ga-lobby", 1200, 700),
  airport: P("ga-airport", 800, 500),
  mobileKey: P("ga-keycard", 800, 500),
  minibarPay: P("ga-minibar", 800, 500),
  happyHour: P("ga-cocktail", 800, 500),
  weatherSun: P("ga-sunny", 800, 500),
  weatherRain: P("ga-rain", 800, 500),
  seaUpgrade: P("ga-seaview", 960, 600),
  spa: P("ga-spa", 800, 500),
  roomAddons: P("ga-bedroom", 800, 500),
  dineHeader: P("ga-dining", 1200, 700),
  profileWelcome: P("ga-welcome", 900, 560),
  housekeeping: P("ga-towels", 800, 500),
  folioDesk: P("ga-desk", 800, 500),
  giftRose: P("ga-flowers", 800, 500),
  spotifyMood: P("ga-music", 800, 500),
  lightReading: P("ga-read", 600, 400),
  lightRelax: P("ga-relax", 600, 400),
  lightRomantic: P("ga-romantic", 600, 400),
};

/** API segment offer id → cover image */
export const segmentOfferImages = {
  "seg-family": P("ga-seg-family", 800, 500),
  "seg-romance": P("ga-seg-romance", 800, 500),
  "seg-default": P("ga-seg-default", 800, 500),
};
