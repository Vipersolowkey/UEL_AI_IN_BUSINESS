import { useCallback, useState } from "react";

import GuestAppImg from "../../components/guestapp/GuestAppImg";
import { guestAppBookingInquiry } from "../../lib/guestAppApi";
import { guestAppImages } from "../../lib/guestAppImages";

export default function GuestAppBook() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [areaName, setAreaName] = useState("Nha Trang");
  const [roomPref, setRoomPref] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");

  const submit = useCallback(async () => {
    setBusy(true);
    setDoneMsg("");
    try {
      if (!checkIn || !checkOut) throw new Error("Choose check-in and check-out dates.");
      const out = await guestAppBookingInquiry({
        full_name: fullName.trim(),
        email: email.trim(),
        check_in: checkIn,
        check_out: checkOut,
        guests,
        area_name: areaName,
        room_pref: roomPref.trim() || null,
        notes: notes.trim() || null,
      });
      setDoneMsg(out?.message || "Request received.");
      setNotes("");
    } catch (e) {
      setDoneMsg(e?.message || "Could not send request.");
    } finally {
      setBusy(false);
    }
  }, [areaName, checkIn, checkOut, email, fullName, guests, notes, roomPref]);

  return (
    <div className="ga-stagger space-y-5">
      <section className="ga-stagger-item ga-animate-in relative overflow-hidden rounded-3xl border border-white/10">
        <GuestAppImg
          src={guestAppImages.heroLobby}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1714] via-[#0f1714]/88 to-[#0f1714]/55" />
        <div className="relative p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-emerald-200/75">New guest</p>
          <p className="mt-1 text-lg font-semibold text-white">Request a stay</p>
          <p className="mt-1 text-sm text-white/60">
            This sends a lead to reservations (demo). You do not need an existing booking reference.
          </p>
        </div>
      </section>

      <section className="ga-stagger-item rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs font-medium text-white/60">
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white"
              autoComplete="name"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-white/60">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white"
              autoComplete="email"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-white/60">
            Destination
            <select
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white"
            >
              <option value="Nha Trang">Nha Trang</option>
              <option value="Đà Lạt">Đà Lạt</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs font-medium text-white/60">
              Check-in
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/25 px-2 py-2 text-sm text-white"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-white/60">
              Check-out
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/25 px-2 py-2 text-sm text-white"
              />
            </label>
          </div>
          <label className="grid gap-1 text-xs font-medium text-white/60">
            Guests
            <input
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value) || 1)}
              className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-white/60">
            Room preference (optional)
            <input
              value={roomPref}
              onChange={(e) => setRoomPref(e.target.value)}
              className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white"
              placeholder="Sea view, twin beds…"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-white/60">
            Notes (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white"
              placeholder="Late arrival, celebration, accessibility…"
            />
          </label>
          <button
            type="button"
            disabled={busy || !fullName.trim() || !email.trim()}
            onClick={submit}
            className="mt-1 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send to reservations"}
          </button>
          {doneMsg ? (
            <p className={`text-sm ${doneMsg.includes("Could not") || doneMsg.includes("detail") ? "text-rose-300" : "text-emerald-200/90"}`}>
              {doneMsg}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
