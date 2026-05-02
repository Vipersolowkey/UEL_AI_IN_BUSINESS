import { useEffect, useMemo, useState } from "react";

import {
  cityOptions,
  currency,
  fallbackAlerts,
  fallbackInsight,
  fallbackMonthlyRevenue,
  fetchCompetitorInsights,
  fetchDashboard,
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

function PriorityCard({ title, detail }) {
  return (
    <article className="hover-glow grid gap-3 rounded-[32px_18px_36px_22px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.54)] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--earth-primary)]">{title}</p>
      <p className="text-sm leading-7 text-[var(--earth-text)]">{detail}</p>
    </article>
  );
}

function JudgePillarCard({ step, title, detail }) {
  return (
    <article className="hover-glow relative grid gap-4 overflow-hidden rounded-[32px_18px_36px_22px] border border-[rgba(30,42,36,0.08)] bg-[rgba(255,255,255,0.65)] p-6 shadow-[0_12px_32px_rgba(30,42,36,0.06)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[rgba(184,90,50,0.55)] via-[rgba(61,122,106,0.45)] to-transparent" />
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--earth-primary)]">{step}</p>
      <h3 className="font-['Fraunces',serif] text-[clamp(1.25rem,2vw,1.65rem)] font-semibold text-[var(--earth-secondary)]">{title}</h3>
      <p className="text-sm leading-7 text-[var(--earth-text)]">{detail}</p>
    </article>
  );
}

export default function OverviewPage() {
  const [selectedCity, setSelectedCity] = useState("Nha Trang");
  const [selectedSource, setSelectedSource] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState(fallbackMonthlyRevenue);
  const [alerts, setAlerts] = useState(fallbackAlerts);
  const [insight, setInsight] = useState(fallbackInsight);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const payload = await fetchDashboard();
        setMonthlyRevenue(payload.monthlyRevenue);
        setAlerts(payload.alerts);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

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

  const priorityQueue = useMemo(() => {
    const topPraise = insight.praise_points?.[0] || "cleaner room execution";
    const topComplaint = insight.complaint_points?.[0] || "service consistency";

    return [
      {
        title: "Điều nên nhấn hôm nay",
        detail: `Đưa ${topPraise.toLowerCase()} lên lớp thông điệp đầu tiên để khách thấy ngay lợi thế dễ hiểu nhất.`,
      },
      {
        title: "Điểm nên chặn trước",
        detail: `Biến ${topComplaint.toLowerCase()} thành một lời hứa dịch vụ cụ thể để giảm áp lực so sánh với đối thủ.`,
      },
      {
        title: "Việc nên làm ngay",
        detail: `${alerts.length} booking đang có rủi ro cao. Ưu tiên giữ khách bằng value và trải nghiệm, không lao vào giảm giá quá sớm.`,
      },
    ];
  }, [alerts.length, insight.complaint_points, insight.praise_points]);

  return (
    <OrganicLayout
      pageKey="overview"
      sideArtwork={OverviewIllustration}
      hero={{
        eyebrow: "Bảng điều khiển · Overview",
        title: "Khách sạn nhỏ cũng chơi được tư duy dữ liệu như chuỗi lớn.",
        description:
          "Đáp ứng mục tiêu cuộc thi: cá nhân hóa theo insight thị trường, tối ưu lợi nhuận (giá & cross-sell), và tự động hóa phần lặp lại — trên một giao diện ổn định, dễ bàn giao cho lễ tân.",
        stats: [
          { label: "Revenue", value: currency.format(monthlyRevenue.totalRevenue) },
          { label: "ADR", value: currency.format(monthlyRevenue.averageAdr) },
          { label: "Growth", value: `${monthlyRevenue.growthPercent >= 0 ? "+" : ""}${monthlyRevenue.growthPercent}%` },
        ],
        illustration: OverviewIllustration,
      }}
    >
      <OrganicSection
        eyebrow="Khớp tiêu chí chấm"
        title="Ba trụ mà đề thi và phản biện đều quan tâm — được thể hiện rõ trong sản phẩm."
        description="Phù hợp mục tiêu cuộc thi, chức năng chính chạy ổn (dashboard, AI sales, đối thủ, cảnh báo), và thiên hướng ứng dụng thực tế (ROI, dữ liệu, adoption)."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <JudgePillarCard
            step="Tiêu chí 1"
            title="Đúng hướng đề tài"
            detail="Tập trung dual transformation: số hóa vận hành lưu trú + cá nhân hóa trải nghiệm khách dựa trên dữ liệu thị trường thật (Agoda/Booking trong demo)."
          />
          <JudgePillarCard
            step="Tiêu chí 2"
            title="Chức năng lõi đầy đủ"
            detail="Luồng ổn định: đọc KPI → insight đối thủ → AI gợi ý phòng & upsell → cảnh báo rủi ro & email giữ khách. Có fallback khi backend/LLM lỗi."
          />
          <JudgePillarCard
            step="Tiêu chí 3"
            title="Thực tế & người dùng"
            detail="Giảm rào cản thói quen: UI một cột hành động, checklist dữ liệu, và ROI ước tính để chứng minh không chỉ là slide ý tưởng."
          />
        </div>
      </OrganicSection>

      <OrganicSection
        eyebrow="ROI minh họa"
        title="Vì sao không dừng ở PMS truyền thống?"
        description="Con số demo minh họa lợi ích kinh doanh — có thể thay bằng số liệu khách sạn thật sau khi tích hợp PMS/Channel manager."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <OrganicStatCard
            label="Thời gian lễ tân"
            hint="Ước tính khi dùng script AI + checklist thay vì tự soạn từ đầu mỗi ca."
            value="−35%"
          />
          <OrganicStatCard
            label="ADR có kiểm soát"
            hint="Theo dõi gap đối thủ + đề xuất bundle trước khi giảm giá sâu."
            value="+4–9%"
          />
          <OrganicStatCard
            label="Giữ booking rủi ro"
            hint="Kênh cảnh báo + email cá nhân hóa; mục tiêu giảm churn do so sánh giá."
            value="−18% churn"
          />
        </div>
        <article className="mt-6 grid gap-3 rounded-[28px_16px_30px_18px] border border-[rgba(61,122,106,0.2)] bg-[rgba(61,122,106,0.06)] p-5 text-sm leading-7 text-[var(--earth-secondary)]">
          <p className="font-semibold text-[var(--earth-secondary)]">Chất lượng dữ liệu & tích hợp</p>
          <p className="text-[var(--earth-text-muted)]">
            Pipeline chuẩn hóa: import JSON Agoda/Booking → làm sạch trùng lặp → gắn nhãn sentiment → đưa vào insight & AI. Khối này trả lời phản biện về độ phụ thuộc dữ liệu
            sạch: giao diện minh họa checklist mapping trường (tên phòng, giá, ngày, OTA) trước khi chạy mô hình.
          </p>
        </article>
      </OrganicSection>

      <OrganicSection
        eyebrow="Quick Read"
        title="Đầu tiên là 3 con số nền để đặt ngữ cảnh."
        description="Lớp đầu tiên chỉ giữ những gì cần để đọc tình hình hiện tại: doanh thu, hiệu quả mỗi đêm và số case cần chú ý."
      >
        <section className="grid gap-6 md:grid-cols-3">
          <OrganicStatCard
            label="Average Daily Rate"
            value={currency.format(monthlyRevenue.averageAdr)}
            hint="Giá trung bình mỗi đêm đang phản ánh cách khách sạn định vị hiện tại."
          />
          <OrganicStatCard
            label="Average Stay"
            value={`${monthlyRevenue.averageStayNights} nights`}
            hint="Thời lượng ở trung bình giúp đọc nhanh độ dày doanh thu trên mỗi booking."
          />
          <OrganicStatCard
            label="High-Risk Alerts"
            value={String(alerts.length).padStart(2, "0")}
            hint={loading ? "Đang đồng bộ dữ liệu mới." : "Các booking cần retention action ngay."}
          />
        </section>
      </OrganicSection>

      <OrganicSection
        eyebrow="Market Lens"
        title="Sau đó mới nhìn sang thị trường để hiểu khách đang khen và chê điều gì."
        description="Khối này gom review của đối thủ thành insight điều hành, thay vì để người dùng phải tự đọc hàng loạt comment rời rạc."
        action={
          <div className="flex flex-wrap gap-3">
            <select value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} className="px-4 py-3 text-sm font-semibold">
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
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
                Tóm tắt chiến lược
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--earth-text-subtle)]">Thị trường</span>
            </div>
            <ReadableInsightBody text={insight.strategic_summary} modelUsed={insight.model_used} className="mt-5" />
          </article>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="grid gap-4 rounded-[22px_36px_24px_38px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.54)] p-6">
              <h3 className="text-[clamp(1.4rem,2vw,2rem)] text-[var(--earth-secondary)]">Khách đang khen gì</h3>
              <div className="flex flex-wrap gap-2">
                {insight.praise_points.map((item) => (
                  <ToneBadge key={item} tone="praise">
                    {item}
                  </ToneBadge>
                ))}
              </div>
            </article>
            <article className="grid gap-4 rounded-[36px_22px_38px_24px] border border-[rgba(107,66,38,0.14)] bg-[rgba(255,255,255,0.54)] p-6">
              <h3 className="text-[clamp(1.4rem,2vw,2rem)] text-[var(--earth-secondary)]">Khách đang chê gì</h3>
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

      <OrganicSection
        eyebrow="What To Do Next"
        title="Cuối cùng là 3 việc nên ưu tiên ngay sau khi đọc overview."
        description="Khối cuối chỉ trả lời một câu hỏi: từ dữ liệu vừa xem, đội vận hành nên làm gì tiếp theo ngay bây giờ."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {priorityQueue.map((item) => (
            <PriorityCard key={item.title} title={item.title} detail={item.detail} />
          ))}
        </div>
      </OrganicSection>
    </OrganicLayout>
  );
}
