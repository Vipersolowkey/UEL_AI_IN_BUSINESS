import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import { fetchBackendHealth } from "../../lib/dashboardApi";

function SidebarHealth({ ok, checked }) {
  if (!checked) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/55">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300/90" aria-hidden />
        Đang kiểm tra API…
      </span>
    );
  }
  if (ok) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-50">
        <span
          className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.85)]"
          aria-hidden
        />
        Backend đã kết nối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-50">
      <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden />
      Demo / không kết nối backend
    </span>
  );
}

export function BotanicalFlourish({ className = "" }) {
  return (
    <svg viewBox="0 0 220 120" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 106C52 76 70 28 78 8C86 28 104 76 146 106"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M78 20C64 26 50 42 48 58C64 56 78 42 78 20Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M80 38C96 42 108 56 110 72C92 70 82 58 80 38Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M134 40C120 46 108 62 106 78C122 76 134 62 134 40Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M150 24C164 30 178 46 182 64C164 62 150 46 150 24Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function BlobDivider() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[rgba(107,66,38,0.12)] bg-[rgba(255,255,255,0.44)] p-2">
      <svg viewBox="0 0 1200 90" className="h-16 w-full text-[rgba(196,113,74,0.5)]" fill="none" aria-hidden="true">
        <path
          d="M10 58C78 16 154 22 222 44C296 68 362 80 444 62C520 46 586 10 658 12C746 16 790 72 888 76C988 80 1068 18 1190 42"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function OverviewIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 420 320" className={`${className} route-illustration route-illustration-overview`} fill="none" aria-hidden="true">
      <path className="route-illustration-fill" d="M48 210C84 144 134 124 192 124C242 124 286 140 322 182C338 202 350 224 350 254H90C90 236 92 228 100 208" fill="rgba(196,113,74,0.12)" />
      <path className="route-illustration-line" d="M110 252C118 206 140 176 182 160C208 150 238 150 264 160C308 176 336 208 346 252" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M138 250V186" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M190 250V146" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M242 250V168" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M294 250V196" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M96 252H350" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-leaf" d="M276 74C288 44 314 28 350 28C348 62 326 92 286 98" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path className="route-illustration-leaf" d="M286 98C310 108 326 128 334 154" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle className="route-illustration-orb" cx="100" cy="92" r="22" fill="rgba(143,175,143,0.16)" />
      <circle className="route-illustration-line" cx="100" cy="92" r="10" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function SalesIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 420 320" className={`${className} route-illustration route-illustration-sales`} fill="none" aria-hidden="true">
      <rect className="route-illustration-line" x="78" y="70" width="182" height="160" rx="26" stroke="currentColor" strokeWidth="2" />
      <path className="route-illustration-line" d="M116 118H222" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M116 148H204" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M116 178H186" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-fill" d="M286 92C308 92 326 108 326 130C326 154 304 170 280 170C268 170 256 166 248 160L230 176L236 150C228 142 224 130 224 118C224 102 234 92 250 92H286Z" fill="rgba(143,175,143,0.16)" stroke="currentColor" strokeWidth="1.8" />
      <path className="route-illustration-line" d="M250 126H298" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path className="route-illustration-line" d="M250 142H286" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle className="route-illustration-orb" cx="144" cy="248" r="20" fill="rgba(196,113,74,0.14)" />
      <path className="route-illustration-leaf" d="M236 226C262 214 292 220 308 238" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path className="route-illustration-leaf" d="M308 238C286 262 252 270 220 256" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CompetitorsIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 420 320" className={`${className} route-illustration route-illustration-competitors`} fill="none" aria-hidden="true">
      <rect className="route-illustration-line" x="66" y="92" width="110" height="138" rx="26" stroke="currentColor" strokeWidth="2" />
      <rect className="route-illustration-fill" x="192" y="64" width="152" height="166" rx="32" fill="rgba(196,113,74,0.1)" stroke="currentColor" strokeWidth="2" />
      <path className="route-illustration-line" d="M96 128H146" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M96 154H134" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M224 106H304" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M224 136H316" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M224 166H286" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-leaf" d="M128 248C172 220 220 210 278 214" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path className="route-illustration-leaf" d="M278 214L264 202" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path className="route-illustration-leaf" d="M278 214L266 228" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path className="route-illustration-line" d="M340 34C338 66 320 88 286 100" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path className="route-illustration-line" d="M286 100C304 110 320 130 324 148" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function AlertsIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 420 320" className={`${className} route-illustration route-illustration-alerts`} fill="none" aria-hidden="true">
      <path className="route-illustration-fill" d="M212 52C262 52 302 92 302 142V162C302 182 308 194 320 204V212H104V204C116 194 122 182 122 162V142C122 92 162 52 212 52Z" fill="rgba(196,113,74,0.1)" stroke="currentColor" strokeWidth="2" />
      <path className="route-illustration-line" d="M186 236C190 252 200 262 212 262C224 262 234 252 238 236" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M212 32V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="route-illustration-line" d="M84 90L70 76" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path className="route-illustration-line" d="M340 90L354 76" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle className="route-illustration-orb" cx="212" cy="136" r="22" fill="rgba(143,175,143,0.16)" />
      <path className="route-illustration-line" d="M212 124V144" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="212" cy="160" r="2.6" fill="currentColor" />
      <path className="route-illustration-leaf" d="M122 212H302" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function renderIllustration(illustration) {
  if (!illustration) return null;
  if (typeof illustration === "function") {
    const Illustration = illustration;
    return <Illustration className="organic-hero-illustration text-[rgba(30,42,36,0.42)]" />;
  }
  return illustration;
}

export function OrganicLayout({ pageKey, hero, children, sideArtwork = true }) {
  const navItems = [
    { key: "overview", label: "Tổng quan", path: "/overview", hint: "Doanh thu & thị trường" },
    { key: "sales-ai", label: "AI bán phòng", path: "/sales-ai", hint: "Gợi ý & chốt khách" },
    { key: "competitors", label: "Đối thủ", path: "/competitors", hint: "Review & vị thế" },
    { key: "alerts", label: "Cảnh báo", path: "/alerts", hint: "Giữ khách & promo" },
  ];

  const [healthOk, setHealthOk] = useState(null);
  const [healthChecked, setHealthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBackendHealth().then((ok) => {
      if (!cancelled) {
        setHealthOk(ok);
        setHealthChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="luxury-app organic-app-root min-h-screen">
      <aside className="organic-sidebar">
        <div className="organic-sidebar-top flex w-full items-center gap-3">
          <div className="organic-sidebar-brand-mark shrink-0 font-['Fraunces',serif] text-lg font-bold text-white">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/45">Command</p>
            <p className="truncate font-['Fraunces',serif] text-lg font-semibold leading-tight tracking-tight text-white">
              AI Hospitality Hotel
            </p>
            <p className="mt-0.5 hidden text-xs text-white/55 lg:block">Giá động · cross-sell · insight đối thủ</p>
          </div>
          <div className="organic-sidebar-status lg:hidden">
            <SidebarHealth ok={healthOk} checked={healthChecked} />
          </div>
        </div>

        <nav className="organic-sidebar-nav flex" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `organic-sidebar-navlink ${isActive ? "organic-sidebar-navlink-active" : ""}`
              }
            >
              <span className="font-['Fraunces',serif] text-base opacity-90" aria-hidden>
                ·
              </span>
              <span className="grid min-w-0 leading-tight">
                <span>{item.label}</span>
                <span className="hidden text-[11px] font-medium text-white/45 lg:inline">{item.hint}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        {sideArtwork ? (
          <div className="mt-4 hidden justify-center opacity-[0.35] lg:flex">
            {typeof sideArtwork === "function" ? (
              renderIllustration(sideArtwork)
            ) : (
              <BotanicalFlourish className="h-24 w-44 text-white" />
            )}
          </div>
        ) : null}

        <div className="organic-sidebar-status mt-auto hidden border-t border-white/10 pt-5 lg:block">
          <SidebarHealth ok={healthOk} checked={healthChecked} />
        </div>
      </aside>

      <div className={`organic-main-column organic-page-shell organic-page-${pageKey}`}>
        <div className="organic-main-inner mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <OrganicPageHero {...hero} />
          {children}
        </div>
      </div>
    </div>
  );
}

export function OrganicPageHero({ eyebrow, title, description, stats, note, illustration }) {
  return (
    <section className="page-enter organic-hero-shell relative overflow-hidden rounded-[40px_22px_44px_24px] border border-[rgba(30,42,36,0.08)] bg-[linear-gradient(145deg,rgba(255,255,255,0.82)_0%,rgba(248,244,238,0.95)_42%,rgba(255,255,255,0.65)_100%)] p-6 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[rgba(184,90,50,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-[-20%] h-48 w-48 rounded-full bg-[rgba(61,122,106,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(circle,rgba(255,255,255,0.5)_0%,transparent_68%)] opacity-60" />
      <div className="organic-hero-grid relative grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
        <div className="organic-hero-copy grid gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--earth-primary)]">{eyebrow}</p>
          <h1 className="text-gradient-hero max-w-4xl text-[clamp(2.5rem,5vw,4.75rem)] leading-[0.98]">{title}</h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--earth-text-muted)]">{description}</p>
          <div className="organic-hero-stats flex flex-wrap gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="organic-stat-chip min-w-[148px] rounded-[24px] border border-[rgba(30,42,36,0.08)] bg-[rgba(255,255,255,0.72)] px-5 py-4 shadow-[0_8px_24px_rgba(30,42,36,0.06)] backdrop-blur-sm"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--earth-text-subtle)]">{stat.label}</p>
                <p className="mt-2 font-['Fraunces',serif] text-2xl font-semibold tracking-tight text-[var(--earth-secondary)]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="organic-hero-aside grid gap-5 rounded-[32px_20px_38px_22px] border border-[rgba(30,42,36,0.08)] bg-[rgba(255,255,255,0.55)] p-6 shadow-[0_12px_36px_rgba(30,42,36,0.06)] backdrop-blur-md">
          <div className="organic-hero-art-wrap">{renderIllustration(illustration) || <BotanicalFlourish className="h-24 w-48 text-[rgba(30,42,36,0.4)]" />}</div>
          {note ? <p className="text-sm leading-7 text-[var(--earth-text-muted)]">{note}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function OrganicSection({ eyebrow, title, description, action, children }) {
  return (
    <section className="page-enter grid gap-6 rounded-[40px_20px_42px_18px] border border-[rgba(107,66,38,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(240,231,220,0.88))] p-6 shadow-[0_16px_38px_rgba(100,60,20,0.1)] sm:p-8">
      <div className="organic-section-head grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--earth-primary)]">{eyebrow}</p>
          <h2 className="text-[clamp(1.8rem,3vw,3rem)] text-[var(--earth-secondary)]">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-[var(--earth-text-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <BlobDivider />
      {children}
    </section>
  );
}

export function OrganicStatCard({ label, value, hint }) {
  return (
    <article className="hover-glow relative overflow-hidden rounded-[32px_18px_34px_20px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.58)] p-5 shadow-[0_16px_34px_rgba(100,60,20,0.12)]">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-[rgba(196,113,74,0.18)] to-[rgba(143,175,143,0.06)]" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--earth-primary)]">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--earth-secondary)]">{value}</p>
        <p className="mt-2 text-sm text-[var(--earth-text-subtle)]">{hint}</p>
      </div>
    </article>
  );
}

export function ToneBadge({ tone, children }) {
  const classes =
    tone === "praise"
      ? "bg-[rgba(143,175,143,0.2)] text-[var(--earth-secondary)]"
      : tone === "complaint"
        ? "bg-[rgba(196,113,74,0.2)] text-[var(--earth-secondary)]"
        : "bg-[rgba(107,66,38,0.1)] text-[var(--earth-secondary)]";
  return (
    <span className={`inline-flex max-w-full shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${classes}`}>
      {children}
    </span>
  );
}
