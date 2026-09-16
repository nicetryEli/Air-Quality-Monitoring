/**
 * charts.js
 * ----------
 * Quản lý trực quan hoá chất lượng không khí (AQI) phục vụ người dân đô thị:
 * 1. Kế hoạch di chuyển theo giờ (24h Commute Safety Planner) — Cột trái PC 8
 * 2. Dự báo khí quyển 48h tới — Cột trái PC 8
 * 3. So sánh 12 trạm toàn thành phố (Chọn lộ trình sạch) — Cột trái PC 8
 * 4. Đồng hồ tròn Glass AQI Gauge + Bảng thang đo EPA — Đặt đầu trang & widget
 * 5. Bộ chọn đối tượng sức khỏe (Persona Switcher) — Đặt đầu trang
 * 6. Các Widget phụ trợ: Radar đa chất, Mùa nghịch nhiệt, Phân bố năm — Cột phải PC 4
 *
 * Hỗ trợ bộ chọn 3 ngày duy nhất: Hôm nay, Ngày mai, Ngày mốt.
 * Font Be Vietnam Pro chuẩn tiếng Việt, thân thiện và dễ hiểu cho người dân.
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ================================================================
     0. CẤU HÌNH BẢNG MÀU, CHUẨN EPA & FONT TIẾNG VIỆT (THEME SÁNG)
  ================================================================ */
  Chart.defaults.color = "#334155";
  Chart.defaults.font.family =
    "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  const DAILY_DATA_URL = "data/aqi_daily.json";
  const FORECAST_DATA_URL = "data/forecast_48h.json";

  const NEON = {
    green: "#10b981",
    yellow: "#facc15",
    orange: "#fb923c",
    red: "#f87171",
    purple: "#a855f7",
    maroon: "#e11d48",
    cyan: "#38bdf8",
    pink: "#f472b6",
  };

  function rgba(hex, a) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  const AQI_LEVELS = [
    { max: 50, label: "Tốt", color: NEON.green, sub: "Không khí sạch, an toàn tuyệt đối" },
    { max: 100, label: "Trung bình", color: NEON.yellow, sub: "Chấp nhận được cho đa số người" },
    { max: 150, label: "Kém", color: NEON.orange, sub: "Nhóm nhạy cảm nên hạn chế ra ngoài" },
    { max: 200, label: "Xấu", color: NEON.red, sub: "Ảnh hưởng sức khỏe toàn dân" },
    { max: 300, label: "Rất xấu", color: NEON.purple, sub: "Cảnh báo khẩn cấp, đeo khẩu trang N95" },
    { max: Infinity, label: "Nguy hại", color: NEON.maroon, sub: "Tránh mọi hoạt động ngoài trời" },
  ];

  function classifyAQI(aqi) {
    return (
      AQI_LEVELS.find((lv) => aqi <= lv.max) || AQI_LEVELS[AQI_LEVELS.length - 1]
    );
  }

  const MONTH_LABELS = [
    "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12",
  ];
  const POLLUTANT_LABEL = {
    pm25: "PM2.5",
    pm10: "PM10",
    so2: "SO2",
    no2: "NO2",
    co: "CO",
    o3: "O3",
  };

  /* ================================================================
     1. KHO DỮ LIỆU & TRẠNG THÁI HỆ THỐNG
  ================================================================ */
  let STATIONS = [];
  let ALL = [];
  let byStation = {};
  let byDate = {};
  let GLOBAL_MAX = {};
  let FORECAST_MAP = {}; // { "StationName": [48 records] }

  const state = {
    station: null,
    dayOffset: 0, // 0: Hôm nay, 1: Ngày mai, 2: Ngày mốt
    persona: "general", // 'general', 'children', 'elderly', 'asthma'
    dayDates: ["", "", ""], // ['16/9/2026', '17/9/2026', '18/9/2026']
  };

  const charts = {}; // 12 instances (6 mini/main + 6 modal detail)

  /* ================================================================
     2. NẠP DỮ LIỆU (TỰ ĐỘNG KẾT NỐI DATA OFFLINE HOẶC BACKEND)
  ================================================================ */
  function loadAndInit() {
    // 1. Ưu tiên nạp từ data bundle đã được nạp sẵn qua <script> (hoạt động 100% cả file:// và http://)
    if (window.AQI_DAILY_DATA && window.AQI_DAILY_DATA.meta && window.AQI_DAILY_DATA.records) {
      console.log("[AQI Dashboard] Nạp thành công từ data bundle cục bộ.");
      initData(window.AQI_DAILY_DATA, window.AQI_FORECAST_DATA || { forecasts: [] });
      return;
    }

    // 2. Nạp qua fetch nếu đang chạy trên HTTP server
    Promise.all([
      fetch(DAILY_DATA_URL).then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }),
      fetch(FORECAST_DATA_URL)
        .then((r) => r.json())
        .catch(() => ({ forecasts: [] })),
    ])
      .then(([dailyJson, forecastJson]) => {
        initData(dailyJson, forecastJson);
      })
      .catch((err) => {
        console.warn("[AQI Dashboard] Không thể fetch trực tiếp (do CORS file:// hoặc offline), kích hoạt bộ dự phòng tự sinh:", err);
        initFallbackData();
      });
  }

  function initFallbackData() {
    const fallbackStations = [
      "Aotizhongxin", "Changping", "Dingling", "Dongsi", "Guanyuan", "Gucheng",
      "Huairou", "Nongzhanguan", "Shunyi", "Tiantan", "Wanliu", "Wanshouxigong"
    ];
    const fallbackDaily = {
      meta: { stations: fallbackStations },
      records: []
    };
    const fallbackForecast = {
      forecasts: []
    };
    fallbackStations.forEach((st, sIdx) => {
      for (let i = 1; i <= 28; i++) {
        const dStr = `2017-02-${String(i).padStart(2, "0")}`;
        const baseAqi = 45 + ((sIdx * 11 + i * 3) % 110);
        fallbackDaily.records.push([
          dStr, sIdx, Math.round(baseAqi * 0.7), Math.round(baseAqi * 0.9), 12, 38, 750, 42, 8, 2.3, baseAqi, "NE"
        ]);
      }
      for (let h = 1; h <= 48; h++) {
        const pred = Math.round(40 + Math.sin((h + sIdx) / 3.5) * 35 + ((sIdx * 7 + h) % 45));
        fallbackForecast.forecasts.push({
          station_id: sIdx + 1,
          station_name: st,
          forecast_hour: h,
          forecast_day: h <= 24 ? 1 : 2,
          predicted_aqi: Math.max(15, pred),
          predicted_class: classifyAQI(pred).label
        });
      }
    });
    initData(fallbackDaily, fallbackForecast);
  }

  loadAndInit();

  function initData(dailyJson, forecastJson) {
    STATIONS = dailyJson.meta.stations;

    STATIONS.forEach((s) => {
      byStation[s] = [];
      FORECAST_MAP[s] = [];
    });

    const keys = ["pm25", "pm10", "so2", "no2", "co", "o3"];
    GLOBAL_MAX = { pm25: 0, pm10: 0, so2: 0, no2: 0, co: 0, o3: 0 };

    dailyJson.records.forEach((r) => {
      const rec = {
        date: r[0],
        station: STATIONS[r[1]],
        pm25: r[2],
        pm10: r[3],
        so2: r[4],
        no2: r[5],
        co: r[6],
        o3: r[7],
        temp: r[8],
        wspm: r[9],
        aqi: r[10],
        wd: r[11],
      };
      ALL.push(rec);
      byStation[rec.station].push(rec);
      if (!byDate[rec.date]) byDate[rec.date] = {};
      byDate[rec.date][rec.station] = rec;
      keys.forEach((k) => {
        if (rec[k] > GLOBAL_MAX[k]) GLOBAL_MAX[k] = rec[k];
      });
    });

    // Gom dữ liệu dự báo 48h từ mô hình khí quyển theo trạm
    if (forecastJson && forecastJson.forecasts) {
      forecastJson.forecasts.forEach((item) => {
        if (FORECAST_MAP[item.station_name]) {
          FORECAST_MAP[item.station_name].push(item);
        }
      });
    }

    // Khởi tạo trạm mặc định
    state.station = STATIONS[0] || "Đông Thành (Dongsi)";
    populateStationSelect();

    // Khởi tạo bộ chọn 3 ngày: Hôm nay, Ngày mai, Ngày mốt
    setupDaySwitcher();

    // Khởi tạo bộ chọn đối tượng sức khỏe
    setupPersonaSwitcher();

    // Dựng 12 biểu đồ Chart.js
    buildAllCharts();

    // Cập nhật toàn bộ giao diện
    updateAll();

    // Gắn sự kiện chọn trạm
    document.getElementById("station-select").addEventListener("change", (e) => {
      state.station = e.target.value;
      updateAll();
    });
  }

  /* ================================================================
     3. BỘ CHỌN TRẠM & BỘ CHỌN 3 NGÀY (HÔM NAY - NGÀY MAI - NGÀY MỐT)
  ================================================================ */
  function populateStationSelect() {
    const sel = document.getElementById("station-select");
    sel.innerHTML = STATIONS.map(
      (s) => `<option value="${s}">Trạm quan trắc: ${s}</option>`
    ).join("");
    sel.value = state.station;
  }

  function setupDaySwitcher() {
    const today = new Date();

    function formatViDate(d) {
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    const d0 = new Date(today);
    const d1 = new Date(today);
    d1.setDate(today.getDate() + 1);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 2);

    state.dayDates = [formatViDate(d0), formatViDate(d1), formatViDate(d2)];

    const p0 = document.getElementById("date-pill-0");
    const p1 = document.getElementById("date-pill-1");
    const p2 = document.getElementById("date-pill-2");

    if (p0) p0.textContent = state.dayDates[0];
    if (p1) p1.textContent = state.dayDates[1];
    if (p2) p2.textContent = state.dayDates[2];

    const pills = document.querySelectorAll(".day-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => {
          p.classList.remove("active");
          p.setAttribute("aria-selected", "false");
        });
        pill.classList.add("active");
        pill.setAttribute("aria-selected", "true");
        state.dayOffset = Number(pill.dataset.offset || 0);
        updateAll();
      });
    });
  }

  /* ================================================================
     4. XỬ LÝ PERSONA SWITCHER (ĐỐI TƯỢNG SỨC KHỎE)
  ================================================================ */
  function setupPersonaSwitcher() {
    const pills = document.querySelectorAll(".persona-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        state.persona = pill.dataset.persona;
        updatePersonaUI();
      });
    });
  }

  function updatePersonaUI() {
    const tag = document.getElementById("persona-target-tag");
    const personaLabels = {
      general: "Toàn dân (Ngưỡng AQI > 150)",
      children: "Trẻ em & Học sinh (Ngưỡng AQI > 100)",
      elderly: "Người cao tuổi (Ngưỡng AQI > 100)",
      asthma: "Bệnh hô hấp & Tim mạch (Ngưỡng AQI > 100)",
    };
    if (tag) tag.textContent = `Đối tượng: ${personaLabels[state.persona]}`;

    // Cập nhật lại lời khuyên y tế và lộ trình di chuyển
    const aqi = getDayAQI(state.station, state.dayOffset);
    applyMedicalAndTravelAdvice(aqi);
    updateChart2(); // Cập nhật lại biểu đồ di chuyển 24h
  }

  function applyMedicalAndTravelAdvice(aqi) {
    const titleEl = document.getElementById("advice-title");
    const badgeEl = document.getElementById("advice-status-badge");
    const textEl = document.getElementById("advice-text");
    const travelTextEl = document.getElementById("travel-planner-text");
    const lvl = classifyAQI(aqi);

    if (badgeEl) {
      badgeEl.style.borderColor = rgba(lvl.color, 0.4);
      badgeEl.style.backgroundColor = rgba(lvl.color, 0.15);
      badgeEl.style.color = lvl.color;
      badgeEl.style.boxShadow = `0 0 14px ${rgba(lvl.color, 0.25)}`;
    }

    // Cập nhật Widget Thang đo AQI Chuẩn Quốc Tế (cả desktop và dưới đồng hồ trên điện thoại)
    const epaDots = document.querySelectorAll(".epa-compact-dot");
    const epaTexts = document.querySelectorAll(".epa-compact-text");
    epaDots.forEach((dot) => (dot.style.background = lvl.color));
    epaTexts.forEach(
      (txt) => (txt.textContent = `Mức hiện tại: ${lvl.label} (AQI ${aqi})`)
    );

    const dayName =
      state.dayOffset === 0
        ? "HÔM NAY"
        : state.dayOffset === 1
        ? "NGÀY MAI"
        : "NGÀY MỐT";

    if (titleEl) {
      titleEl.textContent = `${dayName} (${state.dayDates[state.dayOffset]}): ${lvl.label.toUpperCase()}`;
    }

    let advice = "";
    let travelAdvice = "";

    if (state.persona === "children") {
      if (aqi <= 50) {
        advice =
          "Chất lượng không khí lý tưởng. Trẻ em có thể thoải mái vui chơi, học thể dục và dã ngoại ngoài trời suốt cả ngày.";
        travelAdvice =
          "Khung giờ đưa đón trẻ và vui chơi ngoài trời hoàn toàn an toàn suốt cả ngày.";
      } else if (aqi <= 100) {
        advice =
          "Mức trung bình chấp nhận được. Trẻ có cơ địa dị ứng thời tiết hoặc viêm mũi họng cần tránh chơi ngoài trời lúc trời nhiều gió bụi.";
        travelAdvice =
          "Nên đưa đón con đi học vào khung giờ 07:00 - 08:00, tránh để trẻ tiếp xúc khói xe gần các ngã tư đông đúc.";
      } else if (aqi <= 150) {
        advice =
          "CẢNH BÁO CHO TRẺ EM & HỌC SINH: Trẻ có nhịp thở nhanh gấp đôi người lớn, dễ tích tụ bụi PM2.5 vào phổi. Nhà trường nên chuyển các tiết thể dục vào phòng kín có máy lọc không khí.";
        travelAdvice =
          "Bắt buộc cho trẻ đeo khẩu trang ôm khít khuôn mặt khi ra đường; hạn chế đi xe máy đường dài giờ cao điểm.";
      } else {
        advice =
          "BÁO ĐỘNG ĐỎ CHO TRẺ EM: Hạn chế tối đa việc cho trẻ ra khỏi nhà. Đóng kín cửa sổ phòng học, bật máy lọc không khí màng lọc HEPA.";
        travelAdvice =
          "Hạn chế ra đường. Khi cần di chuyển, ưu tiên xe buýt kín có điều hòa hoặc phương tiện kín khép kín.";
      }
    } else if (state.persona === "elderly") {
      if (aqi <= 50) {
        advice =
          "Khí trời rất trong lành. Người cao tuổi rất thích hợp đi bộ, tập dưỡng sinh và thái cực quyền ngoài công viên.";
        travelAdvice =
          "Khung giờ vàng đi dạo và tập dưỡng sinh: 05:30 - 07:30 sáng hoặc 17:00 - 18:30 chiều.";
      } else if (aqi <= 100) {
        advice =
          "Mức trung bình. Người già có bệnh nền tim mạch nên tập luyện vừa sức, tránh vận động gắng sức ngoài trời khi trời sương mù.";
        travelAdvice =
          "Khung giờ phù hợp để ra ngoài: 08:00 - 09:30 sáng (khi sương sớm và hiện tượng nghịch nhiệt đã tan bớt).";
      } else {
        advice =
          "CẢNH BÁO Y TẾ NGƯỜI CAO TUỔI: Bụi mịn PM2.5 có thể kích hoạt các cơn co thắt mạch vành và tăng huyết áp đột ngột. Cần ở trong nhà và uống đủ nước ấm.";
        travelAdvice =
          "KHUYẾN CÁO: Tuyệt đối không tập thể dục ngoài trời vào sáng sớm khi sương giữ bụi sát mặt đất. Nên tập nhẹ nhàng trong nhà.";
      }
    } else if (state.persona === "asthma") {
      if (aqi <= 50) {
        advice =
          "Độ ẩm và chất lượng không khí rất tốt. Nguy cơ kích phát cơn hen hoặc viêm xoang dị ứng ở mức rất thấp.";
        travelAdvice =
          "Có thể sinh hoạt, đi lại và làm việc bình thường ngoài trời.";
      } else if (aqi <= 100) {
        advice =
          "Người bệnh hen phế quản và viêm đường hô hấp mãn tính cần luôn mang theo thuốc xịt cắt cơn dự phòng khi ra ngoài.";
        travelAdvice =
          "Nên chọn các tuyến đường nhiều cây xanh, tránh xa các nút giao thông kẹt xe nhiều khói muội diesel.";
      } else {
        advice =
          "BÁO ĐỘNG NGUY HIỂM HÔ HẤP: Bụi PM2.5 và khí NO2/SO2 đang ở mức cao, dễ gây co thắt phế quản cấp. Ở phòng kín, bật máy lọc không khí và chuẩn bị sẵn thuốc điều trị.";
        travelAdvice =
          "HẠN CHẾ RA NGOÀI nếu không thật sự cần thiết. Nếu bắt buộc ra đường, phải đeo khẩu trang chuẩn N95/KN95.";
      }
    } else {
      // Toàn dân (General)
      if (aqi <= 50) {
        advice =
          "Khí quyển trong lành, an toàn cho mọi sinh hoạt, đi lại và luyện tập thể thao của người dân.";
        travelAdvice =
          "Khung giờ lý tưởng cho mọi hoạt động ngoài trời: 06:00 - 09:00 sáng và 17:30 - 21:00 tối.";
      } else if (aqi <= 100) {
        advice =
          "Chất lượng không khí ở mức trung bình chấp nhận được. Người dân có thể sinh hoạt, làm việc bình thường.";
        travelAdvice =
          "Lưu ý lưu lượng xe giờ cao điểm (07:30 - 08:30 và 17:30 - 18:30) làm nồng độ bụi ven đường tăng cao cục bộ.";
      } else if (aqi <= 150) {
        advice =
          "Mức Kém: Bầu trời mờ đục do bụi mịn. Người dân nên giảm thời gian chạy bộ hoặc vận động thể lực ngoài trời.";
        travelAdvice =
          "Nên đeo khẩu trang chống bụi khi đi xe máy. Chủ động chọn lộ trình tránh các nút giao thông đang thi công công trình.";
      } else {
        advice =
          "Mức Xấu / Nguy hại: Toàn thể người dân nên đeo khẩu trang chuẩn N95 khi ra ngoài; đóng cửa nhà để ngăn khói bụi xâm nhập.";
        travelAdvice =
          "Ưu tiên đi lại bằng phương tiện giao thông công cộng khép kín. Hạn chế hạ cửa kính ô tô.";
      }
    }

    if (textEl) textEl.textContent = advice;
    if (travelTextEl) travelTextEl.textContent = travelAdvice;
  }

  /* ================================================================
     5. TÍNH TOÁN DỮ LIỆU THEO NGÀY ĐANG CHỌN (0, 1, 2)
  ================================================================ */
  // Diễn biến 24h đặc trưng đô thị: Giờ cao điểm sáng 7-9h và chiều 17-19h tăng vọt
  const DIURNAL_BASE = [
    42, 38, 35, 33, 36, 45, 68, 92, 108, 85, 65, 58, 55, 60, 66, 74, 95,
    115, 118, 92, 78, 65, 55, 48,
  ];

  function getHourlyDataForDay(station, dayOffset) {
    const list = FORECAST_MAP[station] || [];
    if (list.length >= 48) {
      if (dayOffset === 0) {
        return list.slice(0, 24).map((f) => f.predicted_aqi);
      } else if (dayOffset === 1) {
        return list.slice(24, 48).map((f) => f.predicted_aqi);
      } else {
        // Ngày mốt: Phóng chiếu tiếp diễn từ ngày mai với chu kỳ nhật triều
        const day1 = list.slice(24, 48).map((f) => f.predicted_aqi);
        const day1Avg = day1.reduce((a, b) => a + b, 0) / 24;
        return DIURNAL_BASE.map((v) => Math.round((v * (day1Avg * 1.05)) / 65));
      }
    }

    // Fallback nếu thiếu dữ liệu ML
    const factor = dayOffset === 0 ? 0.9 : dayOffset === 1 ? 1.05 : 1.15;
    return DIURNAL_BASE.map((v) => Math.round(v * factor));
  }

  function getDayAQI(station, dayOffset) {
    const hours = getHourlyDataForDay(station, dayOffset);
    if (dayOffset === 0) {
      // Yêu cầu: Số liệu của đồng hồ AQI là theo thời gian hiện tại của khu vực
      const curH = new Date().getHours();
      if (hours && hours[curH] !== undefined) {
        return hours[curH];
      }
    }
    return Math.round(hours.reduce((a, b) => a + b, 0) / (hours.length || 1));
  }


  /* ================================================================
     6. KHỞI TẠO 12 BIỂU ĐỒ (6 MINI / MAIN + 6 MODAL DETAIL)
  ================================================================ */
  // BIỂU ĐỒ 2: KẾ HOẠCH DI CHUYỂN THEO GIỜ (24H COMMUTE SAFETY)
  function makeTravelPlannerChart(canvasId, mini) {
    const hours24 = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    return new Chart(document.getElementById(canvasId), {
      type: "bar",
      data: {
        labels: hours24,
        datasets: [
          {
            label: "Chỉ số AQI",
            data: new Array(24).fill(50),
            backgroundColor: new Array(24).fill(rgba(NEON.green, 0.7)),
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          title: {
            display: !mini,
            text: "Kế hoạch di chuyển: Mức độ an toàn chất lượng không khí qua 24 giờ",
            color: "#0f172a",
            font: { size: 14, weight: 700 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw;
                const lvl = classifyAQI(v);
                return `AQI: ${v} — Cấp độ: ${lvl.label} (${lvl.sub})`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#475569",
              maxTicksLimit: mini ? 12 : 24,
              font: { size: 11 },
            },
          },
          y: {
            grid: { color: "rgba(0, 0, 0, 0.06)" },
            ticks: { color: "#475569", font: { size: 11 } },
            min: 0,
            suggestedMax: 150,
          },
        },
      },
    });
  }

  // BIỂU ĐỒ 1: DỰ BÁO AQI 48 GIỜ CHUYÊN SÂU
  function makeForecastChart(canvasId, mini) {
    const hours48 = Array.from({ length: 48 }, (_, i) => `+${i + 1}h`);
    return new Chart(document.getElementById(canvasId), {
      type: "line",
      data: {
        labels: hours48,
        datasets: [
          {
            label: "Dự báo AQI",
            data: new Array(48).fill(50),
            borderColor: "#0284c7",
            backgroundColor: "rgba(2, 132, 199, 0.12)",
            borderWidth: 2.5,
            tension: 0.38,
            fill: true,
            pointRadius: mini ? 0 : 2.5,
            pointBackgroundColor: "#0284c7",
            pointHoverRadius: mini ? 4 : 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          title: {
            display: !mini,
            text: "Dự báo liên tục chất lượng không khí trong 48 giờ tiếp theo",
            color: "#0f172a",
            font: { size: 14, weight: 700 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw;
                const lvl = classifyAQI(v);
                return `Dự báo AQI: ${v} — Mức ${lvl.label}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: {
              color: "#475569",
              maxTicksLimit: mini ? 8 : 16,
              font: { size: 11 },
            },
          },
          y: {
            grid: { color: "rgba(0, 0, 0, 0.06)" },
            ticks: { color: "#475569", font: { size: 11 } },
            min: 0,
            suggestedMax: 160,
          },
        },
      },
    });
  }

  // BIỂU ĐỒ 3: SO SÁNH 12 TRẠM QUAN TRẮC TOÀN THÀNH PHỐ
  function makeBar(canvasId, mini) {
    return new Chart(document.getElementById(canvasId), {
      type: "bar",
      data: {
        labels: STATIONS,
        datasets: [
          {
            label: "Chỉ số AQI",
            data: new Array(STATIONS.length).fill(0),
            backgroundColor: STATIONS.map(() => "rgba(2, 132, 199, 0.6)"),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          title: {
            display: !mini,
            text: "So sánh chất lượng không khí giữa 12 trạm toàn thành phố",
            color: "#0f172a",
            font: { size: 14, weight: 700 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw;
                const lvl = classifyAQI(v);
                return `AQI: ${v} — Mức ${lvl.label}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#1e293b",
              maxRotation: 45,
              minRotation: 25,
              font: { size: 10, weight: 600 },
            },
          },
          y: {
            grid: { color: "rgba(0, 0, 0, 0.06)" },
            ticks: { color: "#475569", font: { size: 11 } },
            min: 0,
          },
        },
      },
    });
  }

  // WIDGET CHART 4: RADAR ĐA CHẤT Ô NHIỄM (POLLUTANT PROFILE)
  function makeRadar(canvasId, mini) {
    const isDark =
      (document.documentElement.getAttribute("data-theme") || "light") === "dark";

    return new Chart(document.getElementById(canvasId), {
      type: "radar",
      data: {
        labels: ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3"],
        datasets: [
          {
            label: "Trạm hiện tại",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: isDark ? "#38bdf8" : "#0284c7",
            backgroundColor: isDark
              ? "rgba(56, 189, 248, 0.35)"
              : "rgba(2, 132, 199, 0.22)",
            borderWidth: 2.5,
            pointBackgroundColor: isDark ? "#38bdf8" : "#0284c7",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: mini ? 3.5 : 5,
            pointHoverRadius: mini ? 5.5 : 7,
          },
          {
            label: "TB Đô thị",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: isDark ? "#fbbf24" : "#b45309",
            backgroundColor: isDark
              ? "rgba(251, 191, 36, 0.16)"
              : "rgba(180, 83, 9, 0.08)",
            borderWidth: 2,
            borderDash: [5, 4],
            pointBackgroundColor: isDark ? "#fbbf24" : "#b45309",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.2,
            pointRadius: mini ? 2.5 : 4,
            pointHoverRadius: mini ? 4.5 : 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: {
            display: !mini,
            position: "bottom",
            labels: {
              boxWidth: 12,
              font: { size: 12, weight: 600 },
              color: isDark ? "#f1f5f9" : "#334155",
            },
          },
          title: {
            display: !mini,
            text: "Hồ sơ đa chất ô nhiễm (chuẩn hoá % mức tối đa)",
            color: isDark ? "#f8fafc" : "#0f172a",
            font: { size: 13, weight: 700 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw;
                return ` ${ctx.dataset.label}: ${val}% ngưỡng an toàn`;
              },
            },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            grid: {
              color: isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.09)",
              lineWidth: 1.2,
            },
            angleLines: {
              color: isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.09)",
              lineWidth: 1.2,
            },
            pointLabels: {
              color: isDark ? "#ffffff" : "#0f172a",
              font: { size: mini ? 11.5 : 13, weight: 700 },
            },
            ticks: {
              display: false,
              backdropColor: "transparent",
              stepSize: 25,
            },
          },
        },
      },
    });
  }


  // WIDGET CHART 5: XU HƯỚNG PM2.5 THEO THÁNG & MÙA
  function makeLine(canvasId, mini) {
    return new Chart(document.getElementById(canvasId), {
      type: "line",
      data: {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: "PM2.5 (µg/m³)",
            data: new Array(12).fill(0),
            borderColor: "#ea580c",
            backgroundColor: "rgba(234, 88, 12, 0.15)",
            borderWidth: 2.2,
            tension: 0.38,
            fill: true,
            pointRadius: mini ? 2 : 4,
            pointBackgroundColor: "#ea580c",
            pointHoverRadius: mini ? 4 : 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          title: {
            display: !mini,
            text: "Nồng độ PM2.5 trung bình 12 tháng (Quy luật chu kỳ mùa)",
            color: "#0f172a",
            font: { size: 13, weight: 700 },
          },
          tooltip: {
            callbacks: { label: (ctx) => `PM2.5: ${ctx.formattedValue} µg/m³` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#475569",
              font: { size: mini ? 9 : 11 },
            },
          },
          y: {
            grid: { color: "rgba(0, 0, 0, 0.06)" },
            ticks: {
              color: "#475569",
              font: { size: mini ? 9 : 11 },
            },
            min: 0,
          },
        },
      },
    });
  }

  // WIDGET CHART 6: TỶ LỆ PHÂN CẤP CẢ NĂM (DOUGHNUT)
  function makeDoughnut(canvasId, mini) {
    return new Chart(document.getElementById(canvasId), {
      type: "doughnut",
      data: {
        labels: AQI_LEVELS.map((l) => l.label),
        datasets: [
          {
            data: new Array(AQI_LEVELS.length).fill(0),
            backgroundColor: AQI_LEVELS.map((l) => rgba(l.color, 0.85)),
            borderColor: "#ffffff",
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        cutout: mini ? "65%" : "58%",
        plugins: {
          legend: {
            display: !mini,
            position: "right",
            labels: {
              boxWidth: 10,
              font: { size: 11 },
              color: "#334155",
            },
          },
          title: {
            display: !mini,
            text: "Tỷ lệ các ngày trong năm theo từng cấp độ AQI",
            color: "#0f172a",
            font: { size: 13, weight: 700 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.formattedValue} ngày`,
            },
          },
        },
      },
    });
  }

  function buildAllCharts() {
    charts.chart1 = makeForecastChart("chart1", true);
    charts.chart1Detail = makeForecastChart("chart1-detail", false);

    charts.chart2 = makeTravelPlannerChart("chart2", false);
    charts.chart2Detail = makeTravelPlannerChart("chart2-detail", false);

    charts.chart3 = makeBar("chart3", false);
    charts.chart3Detail = makeBar("chart3-detail", false);

    charts.chart4 = makeRadar("chart4", true);
    charts.chart4Detail = makeRadar("chart4-detail", false);

    charts.chart5 = makeLine("chart5", true);
    charts.chart5Detail = makeLine("chart5-detail", false);

    charts.chart6 = makeDoughnut("chart6", true);
    charts.chart6Detail = makeDoughnut("chart6-detail", false);
  }

  /* ================================================================
     7. CẬP NHẬT DỮ LIỆU ĐỒ THỊ KHI ĐỔI TRẠM, NGÀY HOẶC PERSONA
  ================================================================ */
  function setMetric(n, text) {
    const el = document.getElementById(`chart${n}-metric`);
    if (el) el.textContent = text;
  }
  function setComment(n, text) {
    const el = document.getElementById(`chart${n}-comment`);
    if (el) el.textContent = text;
  }

  function updateAll() {
    const stationRecords = byStation[state.station] || [];
    const aqiForDay = getDayAQI(state.station, state.dayOffset);

    // Cập nhật tên trạm & thời gian cập nhật ở khối Hero Top
    const heroStation = document.getElementById("hero-station-name");
    if (heroStation) heroStation.textContent = `Trạm: ${state.station}`;

    const now = new Date();
    const curHour = now.getHours();
    const curMin = String(now.getMinutes()).padStart(2, "0");
    const aqiCaption = document.querySelector(".aqi-caption");
    const heroObsNote = document.querySelector(".hero-obs-note");

    if (state.dayOffset === 0) {
      if (aqiCaption) aqiCaption.textContent = `AQI Hiện Tại (${curHour}:00)`;
      if (heroObsNote) {
        heroObsNote.textContent = `Cập nhật lúc ${curHour}:${curMin} theo giờ địa phương (Khung giờ ${curHour}:00)`;
      }
    } else {
      const dayLabel = state.dayOffset === 1 ? "Ngày mai" : "Ngày mốt";
      if (aqiCaption) aqiCaption.textContent = `AQI Trung Bình (${dayLabel})`;
      if (heroObsNote) {
        heroObsNote.textContent = `Dự báo mức AQI trung bình ngày ${state.dayDates[state.dayOffset]}`;
      }
    }

    // Cập nhật Gauge đồng hồ tròn (Đặt ở Hero Top)
    if (window.AQIGaugeSet) {
      window.AQIGaugeSet(aqiForDay);
    }

    // Cập nhật Lời khuyên y tế & Kế hoạch di chuyển
    applyMedicalAndTravelAdvice(aqiForDay);

    // Cập nhật chi tiết 6 biểu đồ
    updateChart2(); // Kế hoạch di chuyển 24h
    updateChart1(); // Dự báo 48h chuyên sâu
    updateChart3(); // So sánh 12 trạm
    updateChart4(stationRecords); // Radar đa chất
    updateChart5(stationRecords); // Xu hướng theo mùa
    updateChart6(stationRecords); // Tỷ lệ phân cấp cả năm
  }

  // Cập nhật Chart 2: Kế hoạch di chuyển 24h theo giờ (cố định theo số liệu quan trắc & dự báo)
  function updateChart2() {
    const hourData = getHourlyDataForDay(state.station, state.dayOffset);
    const colors = hourData.map((v) => {
      const lvl = classifyAQI(v);
      return rgba(lvl.color, 0.85);
    });

    const curH = new Date().getHours();
    const isDark =
      (document.documentElement.getAttribute("data-theme") || "light") === "dark";
    const borders = hourData.map((_, i) =>
      state.dayOffset === 0 && i === curH
        ? isDark ? "#38bdf8" : "#0284c7"
        : "transparent"
    );
    const borderWidths = hourData.map((_, i) =>
      state.dayOffset === 0 && i === curH ? 2.5 : 0
    );

    [charts.chart2, charts.chart2Detail].forEach((c) => {
      c.data.datasets[0].data = hourData;
      c.data.datasets[0].backgroundColor = colors;
      c.data.datasets[0].borderColor = borders;
      c.data.datasets[0].borderWidth = borderWidths;
      c.update();
    });

    // Tìm giờ an toàn nhất (AQI thấp nhất) và giờ ô nhiễm nhất (AQI cao nhất)
    let minH = 0,
      maxH = 0;
    hourData.forEach((v, i) => {
      if (v < hourData[minH]) minH = i;
      if (v > hourData[maxH]) maxH = i;
    });

    const dayName =
      state.dayOffset === 0
        ? "Hôm nay"
        : state.dayOffset === 1
        ? "Ngày mai"
        : "Ngày mốt";

    setMetric(
      2,
      `${dayName}: Giờ vàng ${minH}:00 (AQI ${hourData[minH]}) | Cao điểm ${maxH}:00 (AQI ${hourData[maxH]})`
    );
    setComment(
      2,
      `Kế hoạch di chuyển ${dayName.toLowerCase()} (${state.dayDates[state.dayOffset]}): Khung giờ vàng không khí sạch nhất là lúc ${minH}:00 (AQI ~ ${hourData[minH]}). Khung giờ cao điểm ô nhiễm cần đề phòng là lúc ${maxH}:00 (AQI ~ ${hourData[maxH]}). Người dân và học sinh nên chủ động sắp xếp thời gian đi lại phù hợp.`
    );
  }


  // Cập nhật Chart 1: Dự báo chuyên sâu 48h
  function updateChart1() {
    const forecastList = FORECAST_MAP[state.station] || [];
    let data48 = [];
    if (forecastList.length >= 48) {
      data48 = forecastList.map((f) => f.predicted_aqi);
    } else {
      const base = 55;
      data48 = Array.from({ length: 48 }, (_, i) =>
        Math.round(base + Math.sin(i / 3) * 22 + Math.cos(i / 5) * 12)
      );
    }

    const avg48 = Math.round(
      data48.reduce((a, b) => a + b, 0) / (data48.length || 1)
    );
    const max48 = Math.max(...data48);
    const maxHour = data48.indexOf(max48) + 1;

    [charts.chart1, charts.chart1Detail].forEach((c) => {
      c.data.datasets[0].data = data48;
      c.update();
    });

    setMetric(1, `TB 48h: AQI ${avg48} | Đỉnh ô nhiễm: ${max48}`);
    setComment(
      1,
      `Mô hình dự báo khí quyển tại trạm ${state.station}: Chất lượng không khí 48h tới dao động trung bình ở mức AQI ${avg48}. Đỉnh ô nhiễm dự kiến đạt ${max48} vào thời điểm +${maxHour}h tới.`
    );
  }

  // Cập nhật Chart 3: So sánh 12 trạm toàn thành phố
  function updateChart3() {
    const data = STATIONS.map((s) => getDayAQI(s, state.dayOffset));
    const colors = STATIONS.map((s, i) => {
      const lvl = classifyAQI(data[i]);
      return s === state.station ? rgba(lvl.color, 0.98) : rgba(lvl.color, 0.4);
    });
    const borders = STATIONS.map((s) =>
      s === state.station ? "#ffffff" : "rgba(255,255,255,0.1)"
    );

    [charts.chart3, charts.chart3Detail].forEach((c) => {
      c.data.datasets[0].data = data;
      c.data.datasets[0].backgroundColor = colors;
      c.data.datasets[0].borderColor = borders;
      c.data.datasets[0].borderWidth = 2;
      c.update();
    });

    let maxIdx = 0,
      minIdx = 0;
    data.forEach((v, i) => {
      if (v > data[maxIdx]) maxIdx = i;
      if (v < data[minIdx] && v > 0) minIdx = i;
    });

    const dayName =
      state.dayOffset === 0
        ? "Hôm nay"
        : state.dayOffset === 1
        ? "Ngày mai"
        : "Ngày mốt";

    setMetric(3, `Trong lành nhất: ${STATIONS[minIdx]} (AQI ${data[minIdx]})`);
    setComment(
      3,
      `${dayName} (${state.dayDates[state.dayOffset]}): Trạm có không khí trong lành nhất là ${STATIONS[minIdx]} (AQI ${data[minIdx]}); trạm ô nhiễm nhất là ${STATIONS[maxIdx]} (AQI ${data[maxIdx]}). Trạm bạn đang chọn "${state.station}" đạt mức AQI ${data[STATIONS.indexOf(state.station)]}.`
    );
  }

  // Cập nhật Chart 4: Radar đa chất ô nhiễm
  function updateChart4(stationRecords) {
    const keys = ["pm25", "pm10", "so2", "no2", "co", "o3"];
    const avgOf = (records) =>
      keys.map((k) =>
        records.length
          ? records.reduce((a, r) => a + r[k], 0) / records.length
          : 0
      );

    const stationAvg = avgOf(stationRecords);
    const cityAvg = avgOf(ALL);

    const norm = (arr) =>
      arr.map((v, i) =>
        GLOBAL_MAX[keys[i]]
          ? +((v / GLOBAL_MAX[keys[i]]) * 100).toFixed(1)
          : 0
      );

    const stationNorm = norm(stationAvg);
    const cityNorm = norm(cityAvg);

    [charts.chart4, charts.chart4Detail].forEach((c) => {
      c.data.datasets[0].data = stationNorm;
      c.data.datasets[1].data = cityNorm;
      c.update();
    });

    let topIdx = 0;
    stationNorm.forEach((v, i) => {
      if (v > stationNorm[topIdx]) topIdx = i;
    });
    const topLabel = POLLUTANT_LABEL[keys[topIdx]];
    setMetric(4, `Tác nhân chính: ${topLabel}`);
    setComment(
      4,
      `Hồ sơ ô nhiễm trạm ${state.station}: Tác nhân chiếm tỷ trọng cao nhất so với giới hạn an toàn là ${topLabel}.`
    );
  }

  // Cập nhật Chart 5: Xu hướng PM2.5 theo tháng
  function updateChart5(stationRecords) {
    const sums = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    stationRecords.forEach((r) => {
      const m = Number(r.date.slice(5, 7)) - 1;
      sums[m] += r.pm25;
      counts[m] += 1;
    });
    const data = sums.map((s, i) => (counts[i] ? +(s / counts[i]).toFixed(1) : 0));
    const currentMonthIdx = new Date().getMonth(); // Tháng hiện tại (0-11)

    [charts.chart5, charts.chart5Detail].forEach((c, i) => {
      const mini = i === 0;
      c.data.datasets[0].data = data;
      c.data.datasets[0].pointRadius = data.map((_, idx) =>
        idx === currentMonthIdx ? (mini ? 4 : 6) : mini ? 1 : 3
      );
      c.data.datasets[0].pointBackgroundColor = data.map((_, idx) =>
        idx === currentMonthIdx ? "#ffffff" : NEON.orange
      );
      c.update();
    });

    const overallAvg = stationRecords.length
      ? +(
          stationRecords.reduce((a, r) => a + r.pm25, 0) / stationRecords.length
        ).toFixed(1)
      : 0;
    setMetric(5, `PM2.5 TB: ${overallAvg} µg/m³`);
    setComment(
      5,
      `Quy luật chu kỳ mùa tại trạm ${state.station}: Nồng độ PM2.5 trung bình nhiều năm là ${overallAvg} µg/m³. Tháng ${currentMonthIdx + 1} hiện tại đạt khoảng ${data[currentMonthIdx] || overallAvg} µg/m³. Ô nhiễm thường tăng mạnh vào mùa Đông - Xuân do hiện tượng nghịch nhiệt không khí.`
    );
  }

  // Cập nhật Chart 6: Tỷ lệ phân cấp cả năm
  function updateChart6(stationRecords) {
    const counts = AQI_LEVELS.map(() => 0);
    stationRecords.forEach((r) => {
      const lv = classifyAQI(r.aqi);
      const idx = AQI_LEVELS.indexOf(lv);
      if (idx >= 0) counts[idx] += 1;
    });

    [charts.chart6, charts.chart6Detail].forEach((c) => {
      c.data.datasets[0].data = counts;
      c.update();
    });

    const total = stationRecords.length || 1;
    const goodPct = Math.round((counts[0] / total) * 100);
    setMetric(6, `Ngày Tốt: ${goodPct}%`);
    setComment(
      6,
      `Tổng kết phân cấp tại trạm ${state.station}: ${goodPct}% số ngày trong lịch sử đạt cấp độ Tốt. Số ngày chất lượng không khí đạt mức Tốt và Trung bình chiếm trên ${Math.round(
        ((counts[0] + counts[1]) / total) * 100
      )}%.`
    );
  }

  /* ================================================================
     8. CHUYỂN ĐỔI CHẾ ĐỘ SÁNG / TỐI (THEME TOGGLE)
  ================================================================ */
  window.toggleTheme = function () {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  };

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("aqi_theme", theme);

    const iconEl = document.getElementById("theme-icon");
    const textEl = document.getElementById("theme-text");
    if (iconEl && textEl) {
      if (theme === "dark") {
        iconEl.textContent = "☀️";
        textEl.textContent = "Giao diện Sáng";
      } else {
        iconEl.textContent = "🌙";
        textEl.textContent = "Giao diện Tối";
      }
    }

    const isDark = theme === "dark";
    const textColor = isDark ? "#f8fafc" : "#334155";
    const gridColor = isDark
      ? "rgba(255, 255, 255, 0.10)"
      : "rgba(0, 0, 0, 0.06)";
    const tickColor = isDark ? "#94a3b8" : "#475569";

    // Màu tương phản cao dành riêng cho Biểu đồ Radar đa chất trong giao diện tối
    const radarGridColor = isDark
      ? "rgba(255, 255, 255, 0.24)"
      : "rgba(0, 0, 0, 0.09)";
    const radarLabelColor = isDark ? "#ffffff" : "#0f172a";

    Chart.defaults.color = textColor;

    // Cập nhật trục của tất cả các chart hiện có
    Object.values(charts).forEach((c) => {
      if (!c || !c.options) return;
      if (c.options.scales) {
        if (c.options.scales.x) {
          if (c.options.scales.x.ticks) c.options.scales.x.ticks.color = tickColor;
          if (c.options.scales.x.grid) c.options.scales.x.grid.color = gridColor;
        }
        if (c.options.scales.y) {
          if (c.options.scales.y.ticks) c.options.scales.y.ticks.color = tickColor;
          if (c.options.scales.y.grid) c.options.scales.y.grid.color = gridColor;
        }
        if (c.options.scales.r) {
          if (c.options.scales.r.pointLabels) {
            c.options.scales.r.pointLabels.color = radarLabelColor;
            c.options.scales.r.pointLabels.font = { size: 11.5, weight: 700 };
          }
          if (c.options.scales.r.grid) {
            c.options.scales.r.grid.color = radarGridColor;
            c.options.scales.r.grid.lineWidth = 1.2;
          }
          if (c.options.scales.r.angleLines) {
            c.options.scales.r.angleLines.color = radarGridColor;
            c.options.scales.r.angleLines.lineWidth = 1.2;
          }
        }
      }

      if (c.options.plugins) {
        if (c.options.plugins.title) {
          c.options.plugins.title.color = isDark ? "#f8fafc" : "#0f172a";
        }
        if (c.options.plugins.legend && c.options.plugins.legend.labels) {
          c.options.plugins.legend.labels.color = isDark ? "#f1f5f9" : "#334155";
        }
      }

      c.update();
    });

    // Cập nhật màu sắc dataset của Biểu đồ Radar đa chất (Chart 4 và Chart 4 Detail)
    [charts.chart4, charts.chart4Detail].forEach((rc) => {
      if (!rc || !rc.data || !rc.data.datasets || rc.data.datasets.length < 2) return;
      // Dataset 0: Trạm hiện tại (Xanh ngọc/cyan sáng rực, dễ nhìn trên nền tối)
      rc.data.datasets[0].borderColor = isDark ? "#38bdf8" : "#0284c7";
      rc.data.datasets[0].backgroundColor = isDark
        ? "rgba(56, 189, 248, 0.35)"
        : "rgba(2, 132, 199, 0.22)";
      rc.data.datasets[0].pointBackgroundColor = isDark ? "#38bdf8" : "#0284c7";
      rc.data.datasets[0].pointBorderColor = "#ffffff";
      rc.data.datasets[0].pointBorderWidth = 1.5;
      rc.data.datasets[0].borderWidth = 2.5;

      // Dataset 1: TB Đô thị (Vàng hổ phách tương phản cao, nét đứt rõ ràng)
      rc.data.datasets[1].borderColor = isDark ? "#fbbf24" : "#b45309";
      rc.data.datasets[1].backgroundColor = isDark
        ? "rgba(251, 191, 36, 0.16)"
        : "rgba(180, 83, 9, 0.08)";
      rc.data.datasets[1].pointBackgroundColor = isDark ? "#fbbf24" : "#b45309";
      rc.data.datasets[1].pointBorderColor = "#ffffff";
      rc.data.datasets[1].pointBorderWidth = 1.2;
      rc.data.datasets[1].borderWidth = 2;

      rc.update();
    });

    // Cập nhật đường viền bánh Donut (Chart 6) theo màu nền thẻ
    [charts.chart6, charts.chart6Detail].forEach((dc) => {
      if (!dc || !dc.data || !dc.data.datasets || !dc.data.datasets[0]) return;
      dc.data.datasets[0].borderColor = isDark ? "#0f172a" : "#ffffff";
      dc.update();
    });
  }


  // Khởi tạo theme (mặc định là light theo yêu cầu nền trắng solid)
  const savedTheme = localStorage.getItem("aqi_theme") || "light";
  applyTheme(savedTheme);

  // Tự động kiểm tra và cập nhật nhãn phút / chuyển giờ theo thời gian thực địa phương
  let lastObsHour = new Date().getHours();
  setInterval(() => {
    if (state.dayOffset === 0) {
      const now = new Date();
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, "0");
      const heroObsNote = document.querySelector(".hero-obs-note");
      if (heroObsNote) {
        heroObsNote.textContent = `Cập nhật lúc ${h}:${m} theo giờ địa phương (Khung giờ ${h}:00)`;
      }
      // Nếu nhảy sang khung giờ tiếp theo, cập nhật lại số liệu đồng hồ AQI
      if (h !== lastObsHour) {
        lastObsHour = h;
        updateAll();
      }
    }
  }, 20000);
});

