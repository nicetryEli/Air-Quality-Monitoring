const canvas = document.getElementById("ocean");
const ctx = canvas.getContext("2d");
let W, H, DPR;

function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize); resize();

// Bảng màu chuẩn thiên nhiên theo từng mốc giờ (0.0 đến 24.0)
const HOUR_KEYS = [
    { h: 0.0,  name: "ĐÊM KHUYA",   skyTop: [8, 12, 30],    skyHor: [20, 28, 55],    star: 1.0 },
    { h: 4.5,  name: "RẠNG ĐÔNG",   skyTop: [16, 22, 48],   skyHor: [36, 44, 76],    star: 0.8 },
    { h: 5.5,  name: "BÌNH MINH",   skyTop: [42, 50, 96],   skyHor: [248, 172, 122], star: 0.2 },
    { h: 7.0,  name: "SÁNG SỚM",    skyTop: [56, 112, 192], skyHor: [205, 218, 235], star: 0.0 },
    { h: 10.0, name: "BUỔI SÁNG",   skyTop: [64, 136, 212], skyHor: [188, 224, 238], star: 0.0 },
    { h: 12.5, name: "BUỔI TRƯA",   skyTop: [58, 142, 218], skyHor: [176, 216, 232], star: 0.0 },
    { h: 15.5, name: "BUỔI CHIỀU",  skyTop: [64, 126, 198], skyHor: [196, 220, 236], star: 0.0 },
    { h: 17.2, name: "HOÀNG HÔN",   skyTop: [76, 92, 160],  skyHor: [255, 188, 108], star: 0.0 },
    { h: 18.5, name: "CHẠNG VẠNG",  skyTop: [48, 38, 86],   skyHor: [245, 105, 65],  star: 0.25 },
    { h: 19.8, name: "TỐI TRỜI",    skyTop: [22, 24, 55],   skyHor: [76, 52, 90],    star: 0.65 },
    { h: 21.0, name: "ĐÊM TRĂNG",   skyTop: [10, 14, 35],   skyHor: [34, 44, 82],    star: 1.0 },
    { h: 24.0, name: "ĐÊM KHUYA",   skyTop: [8, 12, 30],    skyHor: [20, 28, 55],    star: 1.0 }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpRGB(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgb(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }

function getPaletteByHour(h) {
    let hour = h % 24;
    if (hour < 0) hour += 24;
    
    let i = 0;
    while (i < HOUR_KEYS.length - 1 && hour >= HOUR_KEYS[i + 1].h) {
        i++;
    }
    const a = HOUR_KEYS[i];
    const b = HOUR_KEYS[Math.min(i + 1, HOUR_KEYS.length - 1)];
    const span = (b.h - a.h) || 1;
    const k = Math.max(0, Math.min(1, (hour - a.h) / span));

    return {
        name: k < 0.5 ? a.name : b.name,
        skyTop: lerpRGB(a.skyTop, b.skyTop, k),
        skyHor: lerpRGB(a.skyHor, b.skyHor, k),
        star: lerp(a.star, b.star, k)
    };
}

const stars = Array.from({ length: 160 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.95,
    r: Math.random() * 1.3 + 0.3,
    tw: Math.random() * Math.PI * 2
}));

const moodName = document.getElementById("mood-name");
const moodTime = document.getElementById("mood-time");
let T = 0;

function strPad(n) { return String(n).padStart(2, "0"); }

function draw() {
    T += 0.016;

    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    
    // Giờ thập phân chính xác tuyệt đối theo thời gian thực
    const decimalHour = h + m / 60 + s / 3600 + ms / 3600000;

    // Cập nhật đồng hồ số góc trên
    if (moodTime) {
        moodTime.textContent = `${strPad(h)}:${strPad(m)}`;
    }

    // Lấy màu bầu trời theo giờ thực tế
    const P = getPaletteByHour(decimalHour);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, rgb(P.skyTop));
    sky.addColorStop(1, rgb(P.skyHor));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Vẽ sao lấp lánh khi trời tối hoặc ban đêm
    if (P.star > 0.01) {
        stars.forEach((st) => {
            const tw = 0.5 + 0.5 * Math.sin(T * 2.2 + st.tw);
            ctx.fillStyle = rgb([255, 255, 255], P.star * tw * 0.92);
            ctx.beginPath();
            ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    if (moodName) moodName.textContent = P.name;

    requestAnimationFrame(draw);
}

draw();