import { useCallback, useEffect, useState } from "react";

import { useGuestAppBooking } from "../../components/guestapp/GuestAppBookingContext";
import {
  guestAppAnonymousFeedback,
  guestAppFirstTimerGuide,
  guestAppLogAnalytics,
  guestAppPricingScenarios,
  guestAppRedeemVoucher,
  guestAppVouchers,
} from "../../lib/guestAppApi";

export default function GuestAppExplore() {
  const { bookingRef, showToast } = useGuestAppBooking();
  const [guide, setGuide] = useState(null);
  const [guideErr, setGuideErr] = useState("");
  const [fb, setFb] = useState("");
  const [fbArea, setFbArea] = useState("");
  const [fbBusy, setFbBusy] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    guestAppLogAnalytics({ event_key: "open_explore", booking_ref: bookingRef?.trim() || null }).catch(() => {});
    guestAppFirstTimerGuide(bookingRef, ac.signal)
      .then(setGuide)
      .catch((e) => setGuideErr(e?.message || "Could not load city guide."));
    guestAppVouchers(ac.signal)
      .then((d) => setVouchers(d?.vouchers || []))
      .catch(() => setVouchers([]));
    guestAppPricingScenarios(ac.signal)
      .then(setPricing)
      .catch(() => setPricing(null));
    return () => ac.abort();
  }, [bookingRef]);

  const sendFeedback = useCallback(async () => {
    const t = fb.trim();
    if (t.length < 3) {
      showToast("Please write at least a few characters.");
      return;
    }
    setFbBusy(true);
    try {
      await guestAppAnonymousFeedback({ message: t, area_name: fbArea.trim() || null });
      showToast("Thanks — sent anonymously to the ops team.");
      setFb("");
    } catch (e) {
      showToast(e?.message || "Send failed.");
    } finally {
      setFbBusy(false);
    }
  }, [fb, fbArea, showToast]);

  const redeem = useCallback(async () => {
    const c = redeemCode.trim();
    if (!c) return;
    setRedeemBusy(true);
    try {
      const out = await guestAppRedeemVoucher({ booking_ref: bookingRef, code: c });
      showToast(out?.message || "Applied.");
      setRedeemCode("");
      const refreshed = await guestAppVouchers();
      setVouchers(refreshed?.vouchers || []);
    } catch (e) {
      showToast(e?.message || "Redeem failed.");
    } finally {
      setRedeemBusy(false);
    }
  }, [bookingRef, redeemCode, showToast]);

  return (
    <div className="ga-stagger space-y-5">
      <section className="ga-stagger-item rounded-3xl border border-emerald-400/25 bg-emerald-950/35 p-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-emerald-200/85">First time in the city</p>
        <p className="mt-1 text-sm text-white/70">
          Picks follow your CRM tags on this booking (family vs business). Ref {bookingRef}.
        </p>
        {guideErr ? <p className="mt-2 text-sm text-rose-300/90">{guideErr}</p> : null}
        {guide ? (
          <div className="mt-3 space-y-3">
            <p className="text-base font-semibold text-white">{guide.title}</p>
            <p className="text-xs uppercase tracking-wide text-white/45">Segment · {guide.segment}</p>
            <div>
              <p className="text-xs font-semibold text-emerald-200/80">Eat & drink</p>
              <ul className="mt-2 space-y-2">
                {(guide.food || []).map((x) => (
                  <li key={x.name} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                    <span className="font-semibold text-white">{x.name}</span>
                    <span className="text-white/55"> — {x.why}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-200/80">Places</p>
              <ul className="mt-2 space-y-2">
                {(guide.sights || []).map((x) => (
                  <li key={x.name} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
                    <span className="font-semibold text-white">{x.name}</span>
                    <span className="text-white/55"> — {x.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : !guideErr ? (
          <p className="mt-2 text-sm text-white/50">Loading guide…</p>
        ) : null}
      </section>

      <section className="ga-stagger-item rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/50">Anonymous feedback</p>
        <p className="mt-1 text-xs text-white/55">No account. Message goes straight to operations.</p>
        <textarea
          value={fb}
          onChange={(e) => setFb(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white"
          placeholder="What should we improve?"
        />
        <label className="mt-2 grid gap-1 text-xs text-white/55">
          Area (optional)
          <input
            value={fbArea}
            onChange={(e) => setFbArea(e.target.value)}
            className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white"
            placeholder="Nha Trang"
          />
        </label>
        <button
          type="button"
          disabled={fbBusy}
          onClick={sendFeedback}
          className="mt-3 w-full rounded-2xl bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
        >
          {fbBusy ? "Sending…" : "Send anonymously"}
        </button>
      </section>

      <section className="ga-stagger-item rounded-3xl border border-amber-400/20 bg-amber-950/25 p-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-amber-200/85">Vouchers (campaign control)</p>
        <p className="mt-1 text-xs text-white/55">Limited uses and expiry — redeem attaches to your booking ref.</p>
        <ul className="mt-3 space-y-2">
          {vouchers.length === 0 ? (
            <li className="text-sm text-white/50">No active codes.</li>
          ) : (
            vouchers.map((v) => (
              <li
                key={v.code}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold text-white">{v.code}</p>
                  <p className="text-xs text-white/55">{v.title}</p>
                </div>
                <div className="text-right text-xs text-emerald-200/90">
                  <p>{v.remaining} left</p>
                  <p className="text-white/45">until {v.expires_on}</p>
                </div>
              </li>
            ))
          )}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white uppercase"
            placeholder="CODE"
          />
          <button
            type="button"
            disabled={redeemBusy || !redeemCode.trim()}
            onClick={redeem}
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-400 disabled:opacity-40"
          >
            {redeemBusy ? "…" : "Redeem"}
          </button>
        </div>
      </section>

      {pricing?.scenarios?.length ? (
        <section className="ga-stagger-item rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/50">Stay length vs walk-in (mock)</p>
          <p className="mt-1 text-xs text-white/45">{pricing.disclaimer}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {pricing.scenarios.map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="mt-2 text-2xl font-bold text-emerald-200 tabular-nums">{s.estimated_profit_index}</p>
                <p className="text-xs text-white/50">Profit index (demo)</p>
                <p className="mt-2 text-xs text-white/60">{s.notes}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
