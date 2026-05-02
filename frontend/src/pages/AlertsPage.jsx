import { useEffect, useMemo, useState } from "react";

import {
  currency,
  fallbackAlerts,
  fallbackMonthlyRevenue,
  fetchDashboard,
  fetchPromoEmail,
  normalizeUiErrorMessage,
} from "../lib/dashboardApi";
import {
  AlertsIllustration,
  OrganicLayout,
  OrganicSection,
  OrganicStatCard,
  ToneBadge,
} from "../components/organic/OrganicUI";

function StageCard({ step, title, detail }) {
  return (
    <article className="hover-glow grid gap-3 rounded-[32px_18px_36px_22px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.56)] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--earth-primary)]">Bước {step}</p>
      <h3 className="text-[clamp(1.35rem,2vw,1.9rem)] text-[var(--earth-secondary)]">{title}</h3>
      <p className="text-sm leading-7 text-[var(--earth-text-muted)]">{detail}</p>
    </article>
  );
}

export default function AlertsPage() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(fallbackMonthlyRevenue);
  const [alerts, setAlerts] = useState(fallbackAlerts);
  const [promoPreview, setPromoPreview] = useState(null);
  const [alertSearch, setAlertSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const pageStages = [
    {
      step: "01",
      title: "Nhìn tổng quan rủi ro",
      detail: "Quét số booking có nguy cơ hủy và tổng revenue gap trước khi đi vào từng case.",
    },
    {
      step: "02",
      title: "Đọc từng case",
      detail: "Xem từng booking như một ca giữ khách riêng, có đủ giá, gap và retention angle.",
    },
    {
      step: "03",
      title: "Sinh email giữ khách",
      detail: "Chỉ khi chọn đúng case thì mới tạo promo email để tránh hành động vội.",
    },
  ];

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const payload = await fetchDashboard();
        setMonthlyRevenue(payload.monthlyRevenue);
        setAlerts(payload.alerts);
      } catch {
        setAlerts(fallbackAlerts);
      }
    }

    loadDashboardData();
  }, []);

  const filteredAlerts = useMemo(() => {
    const keyword = alertSearch.trim().toLowerCase();
    return alerts.filter((alert) =>
      [alert.bookingId, alert.guestName, alert.roomType, alert.stayDates].some((field) =>
        String(field || "").toLowerCase().includes(keyword)
      )
    );
  }, [alertSearch, alerts]);

  const summary = useMemo(() => {
    const totalGap = filteredAlerts.reduce(
      (sum, alert) => sum + (alert.competitorPrice ? alert.bookedPrice - alert.competitorPrice : 0),
      0
    );

    return {
      total: filteredAlerts.length,
      totalGap,
      generated: filteredAlerts.filter((alert) => alert.promoGenerated).length,
    };
  }, [filteredAlerts]);

  async function handleGenerate(alert) {
    setLoadingId(alert.bookingId);
    setStatusMessage("");

    try {
      const payload = await fetchPromoEmail({
        booking_id: alert.bookingId,
        guest_name: alert.guestName,
        guest_email: alert.email,
        room_type: alert.roomType,
        stay_dates: alert.stayDates,
        booked_price: alert.bookedPrice,
        competitor_price: alert.competitorPrice,
        risk_level: alert.risk,
        area_name: "Nha Trang",
      });

      setPromoPreview({
        bookingId: alert.bookingId,
        guestName: alert.guestName,
        subject: payload.subject,
        emailBody: payload.email_body,
        modelUsed: payload.model_used,
      });
      setStatusMessage(payload.message);
      setAlerts((current) =>
        current.map((item) => (item.bookingId === alert.bookingId ? { ...item, promoGenerated: true } : item))
      );
    } catch (error) {
      setStatusMessage(normalizeUiErrorMessage(error, "Không thể tạo promo email lúc này."));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <OrganicLayout
      pageKey="alerts"
      sideArtwork={AlertsIllustration}
      hero={{
        eyebrow: "Cảnh báo · Giữ khách",
        title: "Một nơi để nhìn rõ booking nào đang rủi ro và giữ khách bằng hành động có chủ đích.",
        description:
          "Alerts được viết lại để người dùng hiểu ngay đây là màn can thiệp doanh thu: nhìn tổng quan rủi ro trước, đọc từng case sau, rồi mới sinh email giữ khách.",
        stats: [
          { label: "Risk Alerts", value: String(summary.total).padStart(2, "0") },
          { label: "Revenue Gap", value: currency.format(summary.totalGap || 0) },
          { label: "Revenue", value: currency.format(monthlyRevenue.totalRevenue) },
        ],
        illustration: AlertsIllustration,
      }}
    >
      <OrganicSection eyebrow="Quy trình" title="Tổng quan → Chi tiết → Email" description={null}>
        <div className="grid gap-6 lg:grid-cols-3">
          {pageStages.map((item) => (
            <StageCard key={item.step} step={item.step} title={item.title} detail={item.detail} />
          ))}
        </div>
      </OrganicSection>

      {promoPreview ? (
        <OrganicSection
          eyebrow="Step 3"
          title="Email giữ khách đã được tạo cho case đang chọn."
          description={`Bản nháp này được sinh bằng ${promoPreview.modelUsed}. Hãy đọc lại subject và nội dung trước khi dùng thật.`}
          action={
            <button type="button" onClick={() => setPromoPreview(null)} className="px-4 py-3 text-sm font-semibold">
              Đóng preview
            </button>
          }
        >
          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <article className="rounded-[36px_18px_32px_22px] border border-[rgba(196,113,74,0.2)] bg-[rgba(196,113,74,0.08)] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--earth-primary)]">Subject</p>
              <h3 className="mt-4 text-[clamp(1.6rem,2.5vw,2.3rem)] text-[var(--earth-secondary)]">{promoPreview.subject}</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--earth-text-muted)]">Booking: {promoPreview.bookingId}</p>
            </article>
            <article className="rounded-[22px_34px_20px_36px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.54)] p-6">
              <pre className="whitespace-pre-wrap font-inherit text-sm leading-8 text-[var(--earth-text-muted)]">{promoPreview.emailBody}</pre>
            </article>
          </div>
        </OrganicSection>
      ) : null}

      <OrganicSection eyebrow="Tổng quan" title="Rủi ro & khoảng chênh" description={null}
        action={
          <input
            value={alertSearch}
            onChange={(event) => setAlertSearch(event.target.value)}
            placeholder="Tìm booking hoặc guest..."
            className="px-4 py-3 text-sm"
          />
        }
      >
        <div className="grid gap-6 lg:grid-cols-4">
          <OrganicStatCard label="High Risk" value={summary.total} hint="Số booking đang cần retention action." />
          <OrganicStatCard label="Revenue Gap" value={currency.format(summary.totalGap || 0)} hint="Khoảng chênh so với benchmark đối thủ." />
          <OrganicStatCard label="Generated Offers" value={summary.generated} hint="Số case đã có email giữ khách." />
          <article className="rounded-[24px_36px_20px_34px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.54)] p-5">
            <h3 className="text-[clamp(1.4rem,2vw,2rem)] text-[var(--earth-secondary)]">Tình trạng hiện tại</h3>
            <p className="mt-4 text-sm leading-7 text-[var(--earth-text)]">
              {statusMessage || "Chưa có cập nhật. Chọn booking bên dưới để tạo email giữ khách."}
            </p>
          </article>
        </div>
      </OrganicSection>

      <OrganicSection eyebrow="Booking" title="Danh sách cần xử lý" description={null}>
        <div className="grid gap-6">
          {filteredAlerts.map((alert) => {
            const gap = alert.competitorPrice ? alert.bookedPrice - alert.competitorPrice : 0;

            return (
              <article
                key={alert.bookingId}
                className="grid gap-5 rounded-[40px_18px_38px_24px] border border-[rgba(107,66,38,0.14)] bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(240,231,220,0.92))] p-6 xl:grid-cols-[1.08fr_0.92fr_auto]"
              >
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <ToneBadge tone="complaint">{alert.risk} risk</ToneBadge>
                    <ToneBadge tone="neutral">{alert.bookingId}</ToneBadge>
                    {alert.promoGenerated ? <ToneBadge tone="praise">offer ready</ToneBadge> : null}
                  </div>
                  <div className="grid gap-2">
                    <h3 className="text-[clamp(1.5rem,2vw,2.1rem)] text-[var(--earth-secondary)]">{alert.guestName}</h3>
                    <p className="text-sm font-medium text-[var(--earth-text-subtle)]">
                      {alert.roomType} · {alert.stayDates}
                    </p>
                  </div>
                  <p className="rounded-[26px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.5)] p-4 text-sm leading-7 text-[var(--earth-text)]">
                    Đối thủ đang rẻ hơn khoảng {currency.format(gap)} cho một kỳ lưu trú tương tự. Hướng xử lý nên là thêm value và giảm friction trước, chỉ giảm giá khi thật sự cần để chốt.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                  <OrganicStatCard label="Booked Price" value={currency.format(alert.bookedPrice)} hint="Giá booking hiện tại." />
                  <OrganicStatCard label="Competitor Price" value={alert.competitorPrice ? currency.format(alert.competitorPrice) : "N/A"} hint="Mức giá ngoài thị trường." />
                  <OrganicStatCard label="Recovery Potential" value={currency.format(gap)} hint="Khoảng chênh đang cần giữ lại." />
                </div>

                <div className="flex flex-col justify-center gap-3 xl:min-w-[220px]">
                  <button type="button" onClick={() => handleGenerate(alert)} disabled={loadingId === alert.bookingId} className="px-5 py-3 text-sm font-semibold">
                    {loadingId === alert.bookingId ? "Đang tạo email..." : alert.promoGenerated ? "Tạo lại email" : "Tạo email giữ khách"}
                  </button>
                  <button type="button" onClick={() => setPromoPreview(null)} className="px-5 py-3 text-sm font-semibold">
                    Xóa preview
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </OrganicSection>
    </OrganicLayout>
  );
}
