# Quản trị & phân tích khách sạn hỗ trợ AI (UEL)

Tài liệu mô tả **phạm vi, chức năng và cách triển khai bản demo** trên máy cục bộ. Phần đầu trình bày bằng ngôn ngữ gần với vận hành khách sạn; có **hướng dẫn theo từng trang** cho người không chuyên kỹ thuật; cuối file là phụ lục kỹ thuật ngắn.

---

## Tổng quan

Đây là **phiên bản demo** của một hệ thống hỗ trợ **theo dõi vận hành và định giá**, tích hợp **phân tích thị trường / đối thủ** và **module AI tùy chọn** (khi cấu hình khóa dịch vụ). Dữ liệu trong demo là **mẫu đã nạp sẵn**, phục vụ minh họa luồng làm việc chứ không phải PMS thực tế.

**Phạm vi chính:**

- Dashboard **doanh thu**, **tin hiệu ưu tiên** và **cảnh báo** gắn với nguy cơ **hủy phòng** khi áp lực giá từ thị trường.
- **Đối thủ / khu vực**: dữ liệu competitor nhập sẵn; có thể bổ sung insight hoặc hội thoại qua AI khi bật nhà cung cấp LLM.
- **Khách & trải nghiệm (demo):** khảo sát **NPS** sau ở (1–5 sao + ghi chú), **góp ý ẩn danh**, lộ trình **lần đầu đến thành phố** theo segment CRM, upsell theo **buổi trong ngày**, voucher có **giới hạn lượt / hạn dùng**, heatmap giá theo vùng (mock), sự kiện địa phương (seed), so sánh **lợi nhuận kịch bản** đặt sớm vs walk-in (mock), **nhật ký truy cập folio** (minh họa privacy), **đối thủ ghim** trên sidebar Overview, bảng **tần suất dùng app** và **thời gian đáp ứng dịch vụ** (mock).
- **App khách (guest app)** — trải nghiệm trong kỳ nghỉ: timeline lưu trú, ưu đãi theo segment CRM, đặt bàn / gọi món (có **xác nhận chính sách hủy/hoàn** trước khi gửi), folio & xuất bill, yêu cầu dọn phòng, tab **Explore** (góp ý ẩn danh + guide + voucher), trang **Book** (form đặt phòng cho người mới, không cần mã booking), chat concierge (SSE); đồng bộ qua API `guest-app` (nhập **mã booking** trên màn hình). Giao diện app khách hiện dùng **tiếng Anh** cho demo quốc tế.
- **Vận hành phòng & buồng phòng (HK)** — bảng theo từng phòng: trạng thái lưu trú (trống / đã đặt / đang ở) và trạng thái dọn phòng; dành cho lễ tân / HK (`/operations/rooms`).
- **Công cụ bổ sung:** lịch **công suất phòng**, **xuất báo cáo** (Excel/CSV), **CRM khách** dạng nhẹ, **đa cơ sở / khu vực**, **ngưỡng cảnh báo** kèm webhook, **Owner guest pulse**, **Rankings**, **Sales AI**.

Giải pháp **không** thay thế phần mềm quản lý buồng phòng (PMS) **đầy đủ**; thể hiện hướng **kết hợp dữ liệu, giao diện và AI** trong bối cảnh revenue / ops.

---

## Hai khu vực giao diện

| Khu vực | Ai dùng | Đặc điểm |
|--------|---------|----------|
| **Trang vận hành (Ops)** | Nhân viên, quản lý | Menu bên trái, nhiều số liệu và công cụ. Đường dẫn ví dụ: `/overview`, `/guests`. |
| **App khách** | Khách lưu trú (hoặc demo) | Giao diện tối, ít mục hơn. Đường dẫn: `/guest-app`. Nút **Ops** trên header để quay lại dashboard (thường chỉ dùng nội bộ khi demo). |

Mở địa chỉ web demo thường vào thẳng **Tổng quan (Overview)**.

---

## Hướng dẫn theo từng trang (dễ đọc, cho người không chuyên kỹ thuật)

### Trang vận hành (menu bên trái)

- **Overview** (`/overview`) — Xem nhanh doanh thu, ADR, tăng trưởng, tình trạng phòng, đến/đi; các khối ưu tiên; **AI Revenue Manager** (bấm làm mới để xem phân tích văn bản); **Pricing Lab** (thử kịch bản giá); **Market lens** (tóm tắt thị trường). Trên màn hình lớn, **sidebar** có thể hiện **đối thủ đang ghim** và **NPS tuần (ISO)**. Khối **Guest app & experience** tổng hợp NPS, góp ý ẩn danh 7 ngày, tần suất mở app, SLA mock, heatmap giá, sự kiện địa phương, nhật ký xem folio, chỉ số lợi nhuận kịch bản (tất cả mang tính **minh họa**), và form **chỉnh đối thủ ghim**.
- **Calendar** (`/calendar`) — Lịch mức lấp đầy / sự kiện theo ngày (theo dữ liệu demo).
- **Rooms & HK** (`/operations/rooms`) — Bảng phòng: ai đang ở, trạng thái dọn phòng (buồng phòng / lễ tân).
- **Reports** (`/reports`) — Tải báo cáo Excel/CSV (nội dung theo bản build).
- **Guests CRM** (`/guests`) — Hồ sơ khách nhẹ: nhãn, ghi chú, timeline.
- **Guest app** (`/guest-app`) — Mở giao diện giống app khách (xem mục App khách bên dưới).
- **App pulse** (`/owner-guest-pulse`) — Tín hiệu góc chủ sở hữu liên quan app khách.
- **Rankings** (`/insights-rankings`) — Bảng xếp hạng / insight so sánh (theo demo).
- **Sales AI** (`/sales-ai`) — Tư vấn bán hàng, playbook, điểm lead; có chat AI khi cấu hình LLM.
- **Competitors** (`/competitors`) — Theo dõi đối thủ, insight, chat thị trường.
- **Alerts** (`/alerts`) — Cảnh báo booking rủi ro, ngưỡng occupancy, v.v.

### App khách (`/guest-app`)

1. Nhập **Booking reference** (mã đặt phòng) — giống trên xác nhận đặt chỗ. Sau khi `seed_db`, có thể dùng mã mẫn hiển thị sẵn trên form (ví dụ `ORT-2026-0003` nếu seed chưa đổi).
2. Nút **Book** — Dành cho **người chưa có mã**: điền form gửi yêu cầu đặt phòng (lead demo).
3. Nút **Ops** — Quay về dashboard (dùng khi demo nội bộ).

**Các tab dưới cùng:**

| Tab | Việc làm chính |
|-----|----------------|
| **Home** | Tóm tắt phòng, ngày đến–đi, timeline lưu trú; thẻ dịch vụ (chuyển sân bay, khóa cửa, minibar…); thời tiết; gợi ý **theo buổi** (sáng/chiều/tối). |
| **Explore** | Lộ trình **lần đầu đến thành phố** (ăn/điểm đến theo CRM); **góp ý ẩn danh** (không cần đăng nhập); danh sách **voucher** và nhập mã **redeem** (cần booking ref hợp lệ); khối so sánh lợi nhuận kịch bản (mock). |
| **Offers** | Ưu đãi gợi ý theo nhãn khách trên booking. |
| **Dine** | Đặt bàn / gửi yêu cầu nhà hàng, menu in-room. **Phải tick** ô chấp nhận chính sách hủy & hoàn (demo) trước khi gửi đặt chỗ hoặc đặt món. |
| **Me** | Xin dọn phòng, xem folio, xem/tải bill; **NPS 1–5 sao + một dòng** gửi về ops. |

**Chat (biểu tượng tròn):** Concierge / AI stream. Nếu không có LLM, vẫn có thể có phản hồi dự phòng — khách thật nên được nhắc **gọi 0** khi khẩn cấp.

---

## Cấu trúc giao diện (bảng tham chiếu nhanh)

| Mục menu | Đường dẫn | Mô tả ngắn |
|----------|-----------|------------|
| Overview | `/overview` | Tổng quan, AI Revenue Manager, Pricing Lab, market lens, **Guest app & experience**, sidebar pin + NPS tuần. |
| Calendar | `/calendar` | Lịch công suất / ngày. |
| Rooms & HK | `/operations/rooms` | Phòng & dọn phòng. |
| Reports | `/reports` | Xuất báo cáo. |
| Guests CRM | `/guests` | Khách, nhãn, timeline. |
| Guest app | `/guest-app` | App khách (Home, Explore, Offers, Dine, Me; Book trên header). |
| App pulse | `/owner-guest-pulse` | Nhịp / tín hiệu app khách. |
| Rankings | `/insights-rankings` | Xếp hạng / insight. |
| Sales AI | `/sales-ai` | Bán hàng & AI. |
| Competitors | `/competitors` | Đối thủ & thị trường. |
| Alerts | `/alerts` | Cảnh báo & ngưỡng. |

**Lưu ý:** Lệnh `seed_db` **xóa và tạo lại** toàn bộ CSDL demo. Sau seed, dùng **mã booking** có trong dữ liệu mẫu cho app khách.

---

## Thuật ngữ (phiên bản rút gọn)

- **Dashboard / Overview**: Màn hình tổng hợp chỉ số và cảnh báo cho nhà điều hành.
- **ADR**: Giá phòng trung bình mỗi đêm (trên báo cáo demo).
- **NPS (trong demo)**: Điểm hài lòng tổng hợp từ khảo sát sao theo tuần ISO; dùng để **minh họa** dashboard, không thay thế khảo sát chuẩn doanh nghiệp.
- **CRM / nhãn khách**: Gắn nhãn (gia đình, công tác…) để gợi ý ưu đãi và lộ trình Explore.
- **AI trong demo**: Gọi API LLM khi có khóa; khi không cấu hình, một số luồng dùng **heuristic** trong mã.
- **SQLite**: Cơ sở dữ liệu một file, phù hợp demo cục bộ; có thể chuyển PostgreSQL qua `DATABASE_URL` (xem `backend/README.md`).

---

## Cài đặt và chạy thử

**Điều kiện:** Python và Node.js trên máy chạy demo. **Backend** phục vụ API và dữ liệu; **frontend** phục vụ trình duyệt.

### Windows (PowerShell)

Thay `D:\du lich` bằng đường dẫn thư mục chứa mã nguồn.

**Terminal 1 — API và dữ liệu:**

```powershell
cd "D:\du lich"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
$env:PYTHONPATH = "$PWD\backend"
python backend\scripts\seed_db.py
uvicorn app.main:app --reload --app-dir backend --host 127.0.0.1 --port 8000
```

**Terminal 2 — giao diện:**

```powershell
cd "D:\du lich\frontend"
npm install
npm run dev
```

Trình duyệt: **http://127.0.0.1:5173**

Để kích hoạt LLM đầy đủ: trong `backend\.env` đặt **GROQ_API_KEY** hoặc cấu hình **Ollama** theo [backend/README.md](backend/README.md).

### macOS / Linux

Quy trình tương tự (virtualenv, `seed_db`, `uvicorn`, sau đó `npm run dev` trong `frontend/`). Chi tiết: [backend/README.md](backend/README.md), [frontend/README.md](frontend/README.md).

---

## Phụ lục kỹ thuật

- **Thư mục:** `backend/` (API, seed), `frontend/` (React/Vite).
- **Kiểm tra API:** http://127.0.0.1:8000/health — **OpenAPI:** http://127.0.0.1:8000/docs
- **API app khách:** prefix `/api/v1/guest-app/` — ngoài session, timeline, offers, dining/HK, folio, bill export còn có (trong các bản mới): `POST /nps`, `POST /feedback-anonymous`, `GET /first-timer-guide`, `GET /time-upsells`, `GET /pricing-scenarios`, `GET /vouchers`, `POST /voucher/redeem`, `POST /booking-inquiry`, `POST /analytics/event`, v.v. Chi tiết tham số: **OpenAPI** hoặc [TAI_LIEU_DU_AN.md](TAI_LIEU_DU_AN.md) (nếu có cập nhật).
- **API dashboard trải nghiệm:** `GET /api/v1/dashboard/experience-insights`, `GET|PUT /api/v1/dashboard/pinned-competitor`.
- **Frontend — biến môi trường:** `VITE_API_BASE_URL` (mặc định `http://127.0.0.1:8000/api/v1`); tùy chọn `VITE_WEATHER_LAT` / `VITE_WEATHER_LON` cho widget thời tiết trên Home app khách.
- **Bảo mật:** Bản demo **không** có xác thực người dùng; chỉ dùng trong môi trường cục bộ hoặc mạng tin cậy. Triển khai công khai cần HTTPS, auth và giới hạn tần suất gọi AI.
- **Dữ liệu minh họa:** Heatmap giá, SLA, sự kiện địa phương, chỉ số lợi nhuận kịch bản, một phần log app là **mock/seed** — không dùng làm quyết định tài chính hay pháp lý.

---

Tài liệu dự án bổ sung (nếu có): [TAI_LIEU_DU_AN.md](TAI_LIEU_DU_AN.md).

**Lên mạng (khuyến nghị — một URL, gồm UI + API):** [Render Blueprint](https://dashboard.render.com) với [`render.yaml`](render.yaml) ở gốc repo (Docker giống `docker compose`: Nginx + React build + FastAPI). Hướng dẫn từng bước và seed sau deploy: [DEPLOY.md](DEPLOY.md) (mục A cục bộ / VPS, mục C Render).

**Chỉ frontend trên Vercel:** deploy được `frontend/`, nhưng cần tự cấu hình `VITE_API_BASE_URL` trỏ tới API công khai; mặc định không coi là bản “đủ” như Docker một service.

**Định hướng mở rộng (app khách, upsell, hai persona chủ/khách):** [DINH_HUONG_APP_KHACH_HOTEL.md](DINH_HUONG_APP_KHACH_HOTEL.md).
