import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  cityOptions,
  currency,
  demandScenarioOptions,
  fallbackAlerts,
  fallbackInsight,
  fallbackMonthlyRevenue,
  fallbackOperationalPulse,
  fallbackPeriodComparison,
  fallbackOperationalPriorities,
  fetchCompetitorInsights,
  fetchDashboard,
  fetchExperienceInsights,
  fetchPricingSimulation,
  fetchProperties,
  fetchRevenueManagerBrief,
  normalizeUiErrorMessage,
  putPinnedCompetitor,
  pricingSimRoomOptions,
  sourceOptions,
} from "../lib/dashboardApi";
import ReadableInsightBody from "../components/ReadableInsightBody";
import {
  OrganicLayout,
  OrganicSection,
  OrganicStatCard,
  OverviewIllustration,
  ToneBadge,
} from "../components/organic/OrganicUI";

function operationalCategoryLabel(category) {
  const labels = {
    retention: "Retention",
    revenue: "Revenue",
    occupancy: "Occupancy",
    cancellation: "Cancellation",
    market: "Market",
  };
  return labels[category] || category;
}

function operationalSeverityTone(severity) {
  if (severity === "critical") return "complaint";
  if (severity === "warning") return "neutral";
  return "praise";
}

function formatPulseDate(isoDate) {
  if (!isoDate || typeof isoDate !== "string") return "—";
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPctVersusPrior(pct, versusLabel = "prior window") {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) return `vs ${versusLabel}: —`;
  const n = Number(pct);
  const sign = n >= 0 ? "+" : "";
  return `vs ${versusLabel}: ${sign}${n}%`;
}

function PeriodComparisonCards({ block, pctVersusLabel = "prior window" }) {
  if (!block) return null;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <OrganicStatCard
        label={`Arrivals (${block.currentLabel})`}
        value={`${block.arrivalsCurrent}`}
        hint={`${block.previousLabel}: ${block.arrivalsPrevious} · ${formatPctVersusPrior(block.arrivalsChangePct, pctVersusLabel)}`}
      />
      <OrganicStatCard
        label={`Departures (${block.currentLabel})`}
        value={`${block.departuresCurrent}`}
        hint={`${block.previousLabel}: ${block.departuresPrevious} · ${formatPctVersusPrior(block.departuresChangePct, pctVersusLabel)}`}
      />
      <OrganicStatCard
        label="Revenue (check-ins in window)"
        value={currency.format(block.checkInRevenueCurrent)}
        hint={`${block.previousLabel}: ${currency.format(block.checkInRevenuePrevious)} · ${formatPctVersusPrior(
          block.revenueChangePct,
          pctVersusLabel
        )}`}
      />
    </div>
  );
}

function formatIsoRangeShort(startIso, endIso) {
  if (!startIso || !endIso || typeof startIso !== "string" || typeof endIso !== "string") return "";
  const fmt = (iso) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

function JudgePillarCard({ step, title, detail }) {
  return (
    <article className="organic-pillar-card group relative grid gap-2 overflow-hidden rounded-2xl border border-[rgba(30,42,36,0.08)] bg-[rgba(255,255,255,0.72)] p-5 shadow-[0_8px_28px_rgba(30,42,36,0.05)] sm:gap-3 sm:rounded-[28px_16px_30px_18px] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[rgba(184,90,50,0.35)] via-[rgba(61,122,106,0.28)] to-transparent" />
      <p className="organic-pillar-step text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[var(--earth-text-subtle)]">{step}</p>
      <h3 className="text-lg font-semibold leading-snug tracking-tight text-[var(--earth-secondary)] sm:text-[1.25rem]">{title}</h3>
      {detail ? <p className="text-sm leading-relaxed text-[var(--earth-text-muted)]">{detail}</p> : null}
    </article>
  );
}

function DataGroundingDetails({ title, data }) {
  if (!data || typeof data !== "object") return null;
  return (
    <details className="mt-4 rounded-2xl border border-[rgba(61,122,106,0.2)] bg-[rgba(61,122,106,0.06)] p-4 text-xs text-[var(--earth-secondary)]">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--earth-primary)]">{title}</summary>
      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words leading-relaxed">{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

function formatVndOps(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(n))} ₫`;
}

export default function OverviewPage() {
  const [selectedCity, setSelectedCity] = useState("Nha Trang");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [properties, setProperties] = useState([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState(fallbackMonthlyRevenue);
  const [alerts, setAlerts] = useState(fallbackAlerts);
  const [operationalPriorities, setOperationalPriorities] = useState(fallbackOperationalPriorities);
  const [operationalPulse, setOperationalPulse] = useState(fallbackOperationalPulse);
  const [periodComparison, setPeriodComparison] = useState(fallbackPeriodComparison);
  const [calendarWeekComparison, setCalendarWeekComparison] = useState(fallbackPeriodComparison);
  const [pipelineComparison, setPipelineComparison] = useState(fallbackPeriodComparison);
  const [insight, setInsight] = useState(fallbackInsight);
  const [revenueBriefAnalysis, setRevenueBriefAnalysis] = useState("");
  const [revenueBriefModel, setRevenueBriefModel] = useState("");
  const [loadingRevenueBrief, setLoadingRevenueBrief] = useState(false);
  const [revenueBriefError, setRevenueBriefError] = useState("");
  const [pricingRoomType, setPricingRoomType] = useState("");
  const [pricingScenario, setPricingScenario] = useState(
    "Cut Deluxe BAR by 8% for two weeks to lift midweek occupancy while keeping the current cancellation policy."
  );
  const [pricingAnalysis, setPricingAnalysis] = useState("");
  const [pricingModel, setPricingModel] = useState("");
  const [pricingGrounding, setPricingGrounding] = useState(null);
  const [pricingDemandScenario, setPricingDemandScenario] = useState("baseline");
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pricingError, setPricingError] = useState("");
  const [revenueBriefGrounding, setRevenueBriefGrounding] = useState(null);

  const [dashboardNotice, setDashboardNotice] = useState(null);
  const [experience, setExperience] = useState(null);
  const [experienceError, setExperienceError] = useState("");
  const [pinForm, setPinForm] = useState({
    competitor_name: "",
    area_name: "Nha Trang",
    price_hint_vnd: 0,
    note: "",
  });
  const [pinSaving, setPinSaving] = useState(false);

  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch(() => setProperties([]));
  }, []);

  const loadRevenueBrief = useCallback(async () => {
    setLoadingRevenueBrief(true);
    setRevenueBriefError("");
    try {
      const payload = await fetchRevenueManagerBrief({ area_name: selectedCity });
      setRevenueBriefAnalysis(payload.analysis);
      setRevenueBriefModel(payload.model_used);
      setRevenueBriefGrounding(payload.data_grounding ?? null);
    } catch (error) {
      setRevenueBriefAnalysis("");
      setRevenueBriefModel("");
      setRevenueBriefGrounding(null);
      setRevenueBriefError(normalizeUiErrorMessage(error, "Could not load revenue briefing."));
    } finally {
      setLoadingRevenueBrief(false);
    }
  }, [selectedCity]);

  const loadExperience = useCallback(async () => {
    setExperienceError("");
    try {
      const data = await fetchExperienceInsights();
      setExperience(data);
      const pc = data?.pinned_competitor;
      if (pc) {
        setPinForm({
          competitor_name: pc.competitor_name || "",
          area_name: pc.area_name || "Nha Trang",
          price_hint_vnd: Number(pc.price_hint_vnd) || 0,
          note: pc.note || "",
        });
      }
    } catch (error) {
      setExperience(null);
      setExperienceError(normalizeUiErrorMessage(error, "Could not load guest experience insights."));
    }
  }, []);

  const savePinnedCompetitor = useCallback(async () => {
    setPinSaving(true);
    try {
      await putPinnedCompetitor({
        competitor_name: pinForm.competitor_name.trim(),
        area_name: pinForm.area_name.trim() || "Nha Trang",
        price_hint_vnd: Number(pinForm.price_hint_vnd) || 0,
        note: pinForm.note?.trim() || null,
      });
      await loadExperience();
    } catch (error) {
      setExperienceError(normalizeUiErrorMessage(error, "Could not save pinned competitor."));
    } finally {
      setPinSaving(false);
    }
  }, [loadExperience, pinForm]);

  useEffect(() => {
    loadExperience();
  }, [loadExperience]);

  const runPricingSimulation = useCallback(async () => {
    const trimmed = pricingScenario.trim();
    if (trimmed.length < 8) {
      setPricingError("Scenario text must be at least 8 characters.");
      return;
    }
    setLoadingPricing(true);
    setPricingError("");
    try {
      const payload = await fetchPricingSimulation({
        area_name: selectedCity,
        room_type: pricingRoomType || null,
        scenario_input: trimmed,
        demand_scenario: pricingDemandScenario,
        property_id: selectedPropertyId === "" ? null : Number(selectedPropertyId),
      });
      setPricingAnalysis(payload.analysis);
      setPricingModel(payload.model_used);
      setPricingGrounding(payload.data_grounding ?? null);
    } catch (error) {
      setPricingAnalysis("");
      setPricingModel("");
      setPricingGrounding(null);
      setPricingError(normalizeUiErrorMessage(error, "Could not run pricing simulation."));
    } finally {
      setLoadingPricing(false);
    }
  }, [pricingDemandScenario, pricingRoomType, pricingScenario, selectedCity, selectedPropertyId]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const pid = selectedPropertyId === "" ? null : Number(selectedPropertyId);
        const payload = await fetchDashboard(pid);
        setDashboardNotice(null);
        setMonthlyRevenue(payload.monthlyRevenue);
        setAlerts(payload.alerts);
        setOperationalPriorities(payload.operationalPriorities ?? fallbackOperationalPriorities);
        setOperationalPulse(payload.operationalPulse ?? fallbackOperationalPulse);
        setPeriodComparison(payload.periodComparison ?? fallbackPeriodComparison);
        setCalendarWeekComparison(payload.calendarWeekComparison ?? fallbackPeriodComparison);
        setPipelineComparison(payload.pipelineComparison ?? fallbackPeriodComparison);
        if (payload.propertyScope?.areaName) {
          setSelectedCity(payload.propertyScope.areaName);
        }
      } catch {
        setDashboardNotice(
          "Could not load the dashboard API (backend down, wrong VITE_API_BASE_URL, or CORS). Operations pulse below is placeholder data, not live PMS."
        );
      }
    }

    loadDashboardData();
  }, [selectedPropertyId]);

  useEffect(() => {
    async function loadInsight() {
      try {
        const payload = await fetchCompetitorInsights({
          area_name: selectedCity,
          source: selectedSource || null,
          max_hotels: 8,
          max_reviews_per_hotel: 3,
        });
        setInsight(payload);
      } catch {
        setInsight({ ...fallbackInsight, area_name: selectedCity, source: selectedSource || null });
      }
    }

    loadInsight();
  }, [selectedCity, selectedSource]);

  useEffect(() => {
    loadRevenueBrief();
  }, [loadRevenueBrief]);

  return (
    <OrganicLayout
      pageKey="overview"
      sideArtwork={OverviewIllustration}
      sidebarExtra={
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white/45">Pinned competitor</p>
            {experience?.pinned_competitor ? (
              <>
                <p className="mt-2 text-sm font-semibold leading-snug text-white">{experience.pinned_competitor.competitor_name}</p>
                <p className="mt-1 text-xs text-white/55">{experience.pinned_competitor.area_name}</p>
                <p className="mt-2 text-sm font-bold text-emerald-200 tabular-nums">
                  {formatVndOps(experience.pinned_competitor.price_hint_vnd)}
                </p>
                {experience.pinned_competitor.note ? (
                  <p className="mt-2 line-clamp-4 text-[0.65rem] leading-relaxed text-white/50">{experience.pinned_competitor.note}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-xs text-white/50">{experienceError ? "Could not load" : "Loading…"}</p>
            )}
          </div>
          {experience?.nps_week ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white/45">NPS (ISO week)</p>
              <p className="mt-2 text-2xl font-bold text-white tabular-nums">
                {experience.nps_week.nps_score != null
                  ? `${experience.nps_week.nps_score > 0 ? "+" : ""}${experience.nps_week.nps_score}`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-white/55">
                {experience.nps_week.response_count} replies
                {experience.nps_week.avg_stars != null ? ` · avg ${experience.nps_week.avg_stars}★` : ""}
              </p>
              <p className="mt-2 text-[0.6rem] text-white/35">{experience.nps_week.week_label}</p>
            </div>
          ) : null}
        </>
      }
      hero={{
        eyebrow: null,
        title: "Overview",
        description: null,
        stats: [
          { label: "Monthly revenue", value: currency.format(monthlyRevenue.totalRevenue) },
          { label: "ADR", value: currency.format(monthlyRevenue.averageAdr) },
          { label: "Growth", value: `${monthlyRevenue.growthPercent >= 0 ? "+" : ""}${monthlyRevenue.growthPercent}%` },
        ],
        illustration: OverviewIllustration,
      }}
    >
      <OrganicSection
        eyebrow={null}
        title="Property scope"
        description="Filter HIGH-risk alerts and occupancy signals to one hotel; market dropdown follows property area."
      >
        <label className="grid max-w-lg gap-2 text-sm font-semibold text-[var(--earth-secondary)]">
          Active property
          <select
            className="px-4 py-3 text-sm font-semibold"
            value={selectedPropertyId}
            onChange={(event) => setSelectedPropertyId(event.target.value)}
          >
            <option value="">All properties (combined)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.area_name}
              </option>
            ))}
          </select>
        </label>
      </OrganicSection>

      <OrganicSection
        eyebrow={null}
        title="Operations pulse"
        description={`Snapshot from seeded PMS bookings · ${formatPulseDate(operationalPulse.asOfDate)} · respects property filter above. Counts use the server calendar date (UTC on the host) and only confirmed / booked / checked_in stays.`}
      >
        {dashboardNotice ? (
          <p className="mb-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            {dashboardNotice}
          </p>
        ) : null}
        {!dashboardNotice &&
        operationalPulse.asOfDate &&
        operationalPulse.totalRooms > 0 &&
        operationalPulse.occupiedRoomsTonight === 0 &&
        operationalPulse.arrivalsNext7Days === 0 &&
        operationalPulse.departuresNext7Days === 0 &&
        operationalPulse.futureCheckInsNext30Days === 0 ? (
          <p className="mb-4 rounded-2xl border border-[rgba(61,122,106,0.25)] bg-[rgba(61,122,106,0.08)] px-4 py-3 text-sm text-[var(--earth-secondary)]">
            The API responded, but every pulse metric is zero for this scope: there may be no active stays in the
            current windows, or the database was not seeded for &quot;today&quot; on the server. Try{" "}
            <strong>All properties (combined)</strong>, run{" "}
            <code className="rounded bg-white/60 px-1">python scripts/seed_db.py</code> on the backend, then refresh.
          </p>
        ) : null}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <OrganicStatCard
            label="Tonight occupancy"
            value={`${operationalPulse.occupancyPctTonight}%`}
            hint={`${operationalPulse.occupiedRoomsTonight} / ${operationalPulse.totalRooms} rooms`}
          />
          <OrganicStatCard label="Rooms occupied tonight" value={`${operationalPulse.occupiedRoomsTonight}`} />
          <OrganicStatCard label="Sellable room inventory" value={`${operationalPulse.totalRooms}`} />
          <OrganicStatCard
            label="Arrivals (7 days)"
            value={`${operationalPulse.arrivalsNext7Days}`}
            hint="Check-ins from today through the next week."
          />
          <OrganicStatCard
            label="Departures (7 days)"
            value={`${operationalPulse.departuresNext7Days}`}
            hint="Check-outs in the same window."
          />
          <OrganicStatCard
            label="Arrivals pipeline (30 days)"
            value={`${operationalPulse.futureCheckInsNext30Days}`}
            hint="Confirmed stays starting within 30 days."
          />
        </div>
      </OrganicSection>

      {periodComparison ? (
        <OrganicSection
          eyebrow={null}
          title="Period comparison (rolling)"
          description={`Last 7 days vs the prior 7 days (check-in / check-out dates). Windows: ${formatIsoRangeShort(
            periodComparison.currentStart,
            periodComparison.currentEnd
          )} vs ${formatIsoRangeShort(periodComparison.previousStart, periodComparison.previousEnd)} · as of ${formatPulseDate(
            periodComparison.asOfDate
          )}.`}
        >
          <PeriodComparisonCards block={periodComparison} pctVersusLabel="prior window" />
        </OrganicSection>
      ) : null}

      {calendarWeekComparison ? (
        <OrganicSection
          eyebrow={null}
          title="Calendar week (Mon–Sun)"
          description={`ISO weeks (Monday start). Current: ${formatIsoRangeShort(
            calendarWeekComparison.currentStart,
            calendarWeekComparison.currentEnd
          )} · Previous: ${formatIsoRangeShort(
            calendarWeekComparison.previousStart,
            calendarWeekComparison.previousEnd
          )} · as of ${formatPulseDate(calendarWeekComparison.asOfDate)}.`}
        >
          <PeriodComparisonCards block={calendarWeekComparison} pctVersusLabel="last week" />
        </OrganicSection>
      ) : null}

      {pipelineComparison ? (
        <OrganicSection
          eyebrow={null}
          title="Forward pipeline"
          description={`Check-ins in the next 7 days vs the 7 days after that (still keyed on check-in / check-out for departures). Near: ${formatIsoRangeShort(
            pipelineComparison.currentStart,
            pipelineComparison.currentEnd
          )} · Further out: ${formatIsoRangeShort(pipelineComparison.previousStart, pipelineComparison.previousEnd)} · as of ${formatPulseDate(
            pipelineComparison.asOfDate
          )}.`}
        >
          <PeriodComparisonCards block={pipelineComparison} pctVersusLabel="following window" />
        </OrganicSection>
      ) : null}

      <OrganicSection
        eyebrow={null}
        title="Workflow"
        description="Suggested daily rhythm (pricing → sales → retention). Not a forced wizard."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <JudgePillarCard step="01" title="Pricing & strategy" detail={null} />
          <JudgePillarCard step="02" title="Sales & upsell" detail={null} />
          <JudgePillarCard step="03" title="Retention" detail={null} />
        </div>
      </OrganicSection>

      <OrganicSection
        eyebrow={null}
        title="Impact benchmark"
        description="Illustrative numbers—not live PMS data."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <OrganicStatCard label="Front desk time" value="−35%" />
          <OrganicStatCard label="ADR" value="+4–9%" />
          <OrganicStatCard label="Risk churn" value="−18%" />
        </div>
      </OrganicSection>

      <OrganicSection eyebrow={null} title="Metrics" description={null}>
        <section className="grid gap-6 md:grid-cols-3">
          <OrganicStatCard label="ADR" value={currency.format(monthlyRevenue.averageAdr)} />
          <OrganicStatCard label="Avg nights" value={`${monthlyRevenue.averageStayNights}`} />
          <OrganicStatCard label="Alerts" value={String(alerts.length).padStart(2, "0")} />
        </section>
      </OrganicSection>

      <OrganicSection eyebrow={null} title="Priorities" description={null}>
        <div className="grid gap-5 lg:grid-cols-2">
          {operationalPriorities.map((row, index) => (
            <article
              key={`${row.category}-${index}`}
              className="hover-glow grid gap-4 rounded-[32px_18px_36px_22px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.56)] p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ToneBadge tone={operationalSeverityTone(row.severity)}>{row.severity}</ToneBadge>
                <ToneBadge tone="neutral">{operationalCategoryLabel(row.category)}</ToneBadge>
              </div>
              <h3 className="font-['Fraunces',serif] text-[clamp(1.2rem,1.8vw,1.45rem)] font-semibold text-[var(--earth-secondary)]">
                {row.title}
              </h3>
              <div className="rounded-[22px] border border-[rgba(61,122,106,0.22)] bg-[rgba(61,122,106,0.07)] p-4 text-sm leading-7 text-[var(--earth-secondary)]">
                {row.suggestedAction}
              </div>
              {row.routeHint && row.routeHint !== "/" ? (
                <Link
                  to={row.routeHint}
                  className="inline-flex w-fit items-center text-sm font-semibold text-[var(--earth-primary)] underline-offset-4 hover:underline"
                >
                  Open
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </OrganicSection>

      <OrganicSection
        eyebrow={null}
        title="Guest app & experience"
        description="Seeded demo warehouse: NPS for the current ISO week, anonymous inbox (7d), guest app event frequency, fulfilment SLA mock, district heat, local events, folio audit trail, early-stay vs walk-in profit index, and pinned competitor editor."
        action={
          <button type="button" className="px-4 py-3 text-sm font-semibold" onClick={() => loadExperience()}>
            Refresh panel
          </button>
        }
      >
        {experienceError ? <p className="text-sm font-medium text-[var(--earth-text)]">{experienceError}</p> : null}
        {!experience && !experienceError ? (
          <div className="skeleton h-48 rounded-[28px] border border-[rgba(30,42,36,0.08)]" />
        ) : null}
        {experience ? (
          <div className="grid gap-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <OrganicStatCard
                label="NPS score (week)"
                value={
                  experience.nps_week?.nps_score != null
                    ? `${experience.nps_week.nps_score > 0 ? "+" : ""}${experience.nps_week.nps_score}`
                    : "—"
                }
                hint={`${experience.nps_week?.response_count ?? 0} replies · ${experience.nps_week?.week_label ?? ""}`}
              />
              <OrganicStatCard
                label="Anonymous feedback (7d)"
                value={String(experience.anonymous_feedback_count_7d ?? 0)}
                hint="Inbox only — no guest identity stored."
              />
              <OrganicStatCard
                label="App events (7d)"
                value={String(experience.app_usage?.events_total ?? 0)}
                hint={`${experience.app_usage?.screen_views ?? 0} screen_view`}
              />
              <OrganicStatCard
                label="SLA samples (14d)"
                value={String(experience.service_sla?.samples ?? 0)}
                hint="Dining / HK / concierge mock fulfilment"
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <article className="grid gap-4 rounded-[28px] border border-[rgba(30,42,36,0.1)] bg-[rgba(255,255,255,0.65)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--earth-text-subtle)]">App usage by key</h3>
                <ul className="grid gap-2 text-sm text-[var(--earth-secondary)]">
                  {Object.entries(experience.app_usage?.top_event_keys || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-3 rounded-xl border border-[rgba(30,42,36,0.08)] bg-white/60 px-3 py-2 tabular-nums">
                        <span className="font-medium">{k}</span>
                        <span>{v}</span>
                      </li>
                    ))}
                </ul>
              </article>
              <article className="grid gap-4 rounded-[28px] border border-[rgba(30,42,36,0.1)] bg-[rgba(255,255,255,0.65)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--earth-text-subtle)]">Service response (avg min)</h3>
                <ul className="grid gap-2 text-sm text-[var(--earth-secondary)]">
                  {Object.entries(experience.service_sla?.by_service || {}).map(([svc, row]) => (
                    <li key={svc} className="flex justify-between gap-3 rounded-xl border border-[rgba(30,42,36,0.08)] bg-white/60 px-3 py-2 tabular-nums">
                      <span className="font-medium">{svc}</span>
                      <span>
                        {row?.avg_minutes ?? "—"} ({row?.count ?? 0})
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <article className="grid gap-4 rounded-[28px] border border-[rgba(30,42,36,0.1)] bg-[rgba(255,255,255,0.65)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--earth-text-subtle)]">
                  ADR heat — {experience.heatmap?.area}
                </h3>
                <p className="text-xs text-[var(--earth-text-muted)]">{experience.heatmap?.note}</p>
                <ul className="mt-2 grid gap-3">
                  {(experience.heatmap?.zones || []).map((z) => (
                    <li key={z.zone} className="grid gap-1">
                      <div className="flex justify-between gap-2 text-sm font-medium text-[var(--earth-secondary)]">
                        <span className="min-w-0 truncate">{z.zone}</span>
                        <span className="shrink-0 tabular-nums text-[var(--earth-primary)]">{formatVndOps(z.median_adr_vnd)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[rgba(30,42,36,0.08)]">
                        <div
                          className="h-full rounded-full bg-[rgba(61,122,106,0.55)]"
                          style={{ width: `${Math.round((z.heat || 0) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="grid gap-4 rounded-[28px] border border-[rgba(30,42,36,0.1)] bg-[rgba(255,255,255,0.65)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--earth-text-subtle)]">Local events & demand</h3>
                <ul className="grid gap-3 text-sm leading-relaxed text-[var(--earth-secondary)]">
                  {(experience.local_events || []).slice(0, 8).map((ev) => (
                    <li key={`${ev.title}-${ev.event_date}`} className="rounded-xl border border-[rgba(30,42,36,0.08)] bg-white/60 px-3 py-2">
                      <p className="font-semibold">{ev.title}</p>
                      <p className="text-xs text-[var(--earth-text-muted)]">
                        {ev.event_date}
                        {ev.ends_on ? ` → ${ev.ends_on}` : ""} · +{ev.expected_lift_pct}% lift (demo)
                      </p>
                      <p className="mt-1 text-xs text-[var(--earth-text-muted)]">{ev.demand_note}</p>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <article className="overflow-hidden rounded-[28px] border border-[rgba(30,42,36,0.1)] bg-[rgba(255,255,255,0.65)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--earth-text-subtle)]">Folio access audit (privacy demo)</h3>
                <div className="mt-3 max-h-64 overflow-auto">
                  <table className="w-full text-left text-xs text-[var(--earth-secondary)]">
                    <thead>
                      <tr className="border-b border-[rgba(30,42,36,0.12)] text-[var(--earth-text-subtle)]">
                        <th className="py-2 pr-2 font-semibold">When</th>
                        <th className="py-2 pr-2 font-semibold">Ref</th>
                        <th className="py-2 pr-2 font-semibold">Actor</th>
                        <th className="py-2 font-semibold">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(experience.recent_audits || []).map((row) => (
                        <tr key={`${row.created_at}-${row.booking_ref}-${row.actor_label}`} className="border-b border-[rgba(30,42,36,0.06)]">
                          <td className="py-2 pr-2 align-top tabular-nums text-[0.65rem] text-[var(--earth-text-muted)]">{row.created_at}</td>
                          <td className="py-2 pr-2 align-top font-mono text-[0.65rem]">{row.booking_ref}</td>
                          <td className="py-2 pr-2 align-top">{row.actor_label}</td>
                          <td className="py-2 align-top text-[var(--earth-text-muted)]">{row.detail || row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <article className="grid gap-4 rounded-[28px] border border-[rgba(30,42,36,0.1)] bg-[rgba(255,255,255,0.65)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--earth-text-subtle)]">Profit index (mock)</h3>
                <p className="text-xs text-[var(--earth-text-muted)]">{experience.pricing_scenarios?.disclaimer}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(experience.pricing_scenarios?.scenarios || []).map((s) => (
                    <div key={s.id} className="rounded-xl border border-[rgba(30,42,36,0.1)] bg-white/70 p-4">
                      <p className="text-sm font-semibold text-[var(--earth-secondary)]">{s.label}</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--earth-primary)]">{s.estimated_profit_index}</p>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--earth-text-muted)]">{s.notes}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="grid gap-4 rounded-[28px] border border-[rgba(30,42,36,0.1)] bg-[rgba(255,255,255,0.65)] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--earth-text-subtle)]">Edit pinned competitor (sidebar)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[var(--earth-secondary)]">
                  Property name
                  <input
                    className="px-4 py-3 text-sm font-semibold"
                    value={pinForm.competitor_name}
                    onChange={(e) => setPinForm((c) => ({ ...c, competitor_name: e.target.value }))}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[var(--earth-secondary)]">
                  Area
                  <input
                    className="px-4 py-3 text-sm font-semibold"
                    value={pinForm.area_name}
                    onChange={(e) => setPinForm((c) => ({ ...c, area_name: e.target.value }))}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[var(--earth-secondary)]">
                  Price hint (VND)
                  <input
                    type="number"
                    min={0}
                    className="px-4 py-3 text-sm font-semibold tabular-nums"
                    value={pinForm.price_hint_vnd}
                    onChange={(e) => setPinForm((c) => ({ ...c, price_hint_vnd: Number(e.target.value) }))}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[var(--earth-secondary)] md:col-span-2">
                  Note
                  <input
                    className="px-4 py-3 text-sm font-semibold"
                    value={pinForm.note || ""}
                    onChange={(e) => setPinForm((c) => ({ ...c, note: e.target.value }))}
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={pinSaving || !pinForm.competitor_name.trim()}
                className="justify-self-start px-5 py-3 text-sm font-semibold"
                onClick={() => savePinnedCompetitor()}
              >
                {pinSaving ? "Saving…" : "Save pin"}
              </button>
            </article>
          </div>
        ) : null}
      </OrganicSection>

      <OrganicSection
        eyebrow={null}
        title="AI Revenue Manager"
        description={null}
        action={
          <button
            type="button"
            onClick={() => loadRevenueBrief()}
            disabled={loadingRevenueBrief}
            className="px-4 py-3 text-sm font-semibold"
          >
            {loadingRevenueBrief ? "Analyzing…" : "Refresh briefing"}
          </button>
        }
      >
        {revenueBriefError ? (
          <p className="text-sm font-medium text-[var(--earth-text)]">{revenueBriefError}</p>
        ) : loadingRevenueBrief && !revenueBriefAnalysis ? (
          <div className="skeleton h-52 rounded-[28px] border border-[rgba(30,42,36,0.08)]" />
        ) : (
          <>
            <ReadableInsightBody text={revenueBriefAnalysis} modelUsed={revenueBriefModel} />
            <DataGroundingDetails title="Numeric grounding sent to the model" data={revenueBriefGrounding} />
          </>
        )}
      </OrganicSection>

      <OrganicSection eyebrow={null} title="Pricing Lab" description={null}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="grid gap-4 rounded-[28px] border border-[rgba(30,42,36,0.1)] bg-[rgba(255,255,255,0.65)] p-5">
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <label className="grid gap-2 text-sm font-semibold text-[var(--earth-secondary)]">
                Market
                <select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                  className="px-4 py-3 text-sm font-semibold"
                >
                  {cityOptions.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[var(--earth-secondary)]">
                Room type
                <select
                  value={pricingRoomType}
                  onChange={(event) => setPricingRoomType(event.target.value)}
                  className="px-4 py-3 text-sm font-semibold"
                >
                  {pricingSimRoomOptions.map((opt) => (
                    <option key={opt.value || "auto"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[var(--earth-secondary)] sm:col-span-2">
                Demand scenario
                <select
                  value={pricingDemandScenario}
                  onChange={(event) => setPricingDemandScenario(event.target.value)}
                  className="px-4 py-3 text-sm font-semibold"
                >
                  {demandScenarioOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-[var(--earth-secondary)]">
              Scenario to simulate
              <textarea
                value={pricingScenario}
                onChange={(event) => setPricingScenario(event.target.value)}
                rows={5}
                className="min-h-[120px] px-4 py-3 text-sm leading-7"
                placeholder="Describe the scenario…"
              />
            </label>
            <button
              type="button"
              onClick={() => runPricingSimulation()}
              disabled={loadingPricing || pricingScenario.trim().length < 8}
              className="justify-self-start px-5 py-3 text-sm font-semibold"
            >
              {loadingPricing ? "Running…" : "Run simulation"}
            </button>
            {pricingError ? <p className="text-sm font-medium text-[var(--earth-text)]">{pricingError}</p> : null}
          </div>
          <div className="min-w-0 rounded-[28px] border border-[rgba(30,42,36,0.08)] bg-[rgba(255,255,255,0.55)] p-5">
            {loadingPricing && !pricingAnalysis ? (
              <div className="skeleton h-56 rounded-2xl border border-[rgba(30,42,36,0.06)]" />
            ) : (
              <>
                <ReadableInsightBody text={pricingAnalysis} modelUsed={pricingModel} />
                <DataGroundingDetails title="Simulation context & grounding" data={pricingGrounding} />
              </>
            )}
          </div>
        </div>
      </OrganicSection>

      <OrganicSection eyebrow={null} title="Market lens" description={null}
        action={
          <div className="flex flex-wrap gap-3">
            <select value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} className="px-4 py-3 text-sm font-semibold">
              {cityOptions.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {sourceOptions.map((option) => (
                <button
                  key={option.value || "all"}
                  type="button"
                  onClick={() => setSelectedSource(option.value)}
                  className={
                    selectedSource === option.value
                      ? "px-4 py-3 text-sm font-semibold bg-[var(--earth-primary)] text-[#faf7f2]"
                      : "px-4 py-3 text-sm font-semibold"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="hover-glow grid gap-5 rounded-[32px_18px_38px_20px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.58)] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <ToneBadge tone="neutral">
                {selectedSource ? sourceOptions.find((option) => option.value === selectedSource)?.label : "All Sources"}
              </ToneBadge>
              <ToneBadge tone="praise">{insight.hotels_analyzed} hotels</ToneBadge>
              <ToneBadge tone="complaint">{insight.reviews_analyzed} reviews</ToneBadge>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[rgba(30,42,36,0.08)] pb-4">
              <h2 className="font-['Fraunces',serif] text-[clamp(1.75rem,3vw,2.6rem)] font-semibold tracking-tight text-[var(--earth-secondary)]">
                Strategic summary
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--earth-text-subtle)]">Market</span>
            </div>
            <ReadableInsightBody text={insight.strategic_summary} modelUsed={insight.model_used} className="mt-5" />
            <DataGroundingDetails title="Competitor rows used for this insight" data={insight.data_grounding} />
          </article>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="grid gap-4 rounded-[22px_36px_24px_38px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.54)] p-6">
              <h3 className="text-[clamp(1.4rem,2vw,2rem)] text-[var(--earth-secondary)]">What guests praise</h3>
              <div className="flex flex-wrap gap-2">
                {insight.praise_points.map((item) => (
                  <ToneBadge key={item} tone="praise">
                    {item}
                  </ToneBadge>
                ))}
              </div>
            </article>
            <article className="grid gap-4 rounded-[36px_22px_38px_24px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.54)] p-6">
              <h3 className="text-[clamp(1.4rem,2vw,2rem)] text-[var(--earth-secondary)]">What guests complain about</h3>
              <div className="flex flex-wrap gap-2">
                {insight.complaint_points.map((item) => (
                  <ToneBadge key={item} tone="complaint">
                    {item}
                  </ToneBadge>
                ))}
              </div>
            </article>
          </div>
        </div>
      </OrganicSection>

    </OrganicLayout>
  );
}
