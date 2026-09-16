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

const KEYS = [
    { t: 0.0, name: "DAWN", skyTop: [38, 44, 86], skyHor: [247, 176, 128], star: 0 },
    { t: 0.28, name: "MORNING", skyTop: [64, 134, 206], skyHor: [188, 222, 236], star: 0 },
    { t: 0.5, name: "MIDDAY", skyTop: [58, 142, 214], skyHor: [176, 216, 230], star: 0 },
    { t: 0.68, name: "GOLDEN HOUR", skyTop: [74, 92, 156], skyHor: [255, 202, 120], star: 0 },
    { t: 0.84, name: "SUNSET", skyTop: [48, 38, 86], skyHor: [255, 108, 68], star: 0.15 },
    { t: 1.0, name: "MOONLIT", skyTop: [8, 12, 30], skyHor: [34, 44, 82], star: 1 }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpRGB(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgb(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }

function getPalette(t) {
    let i = 0; while (i < KEYS.length - 1 && t > KEYS[i + 1].t) i++;
    const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
    const span = b.t - a.t || 1; const k = Math.max(0, Math.min(1, (t - a.t) / span));
    return { 
        name: k < 0.5 ? a.name : b.name, 
        skyTop: lerpRGB(a.skyTop, b.skyTop, k), 
        skyHor: lerpRGB(a.skyHor, b.skyHor, k), 
        star: lerp(a.star, b.star, k) 
    };
}

const stars = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random() * 1.0, r: Math.random() * 1.2 + 0.3, tw: Math.random() * Math.PI * 2 }));

let timeOfDay = 0.5; 
const slider = document.getElementById("time"); 
if (slider) {
    slider.addEventListener("input", () => { timeOfDay = slider.value / 1000; });
}

const moodName = document.getElementById("mood-name"); 
const moodTime = document.getElementById("mood-time");
let T = 0;

function updateTimeFromLocalClock() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    
    // Hiển thị giờ hiện tại chính xác của khu vực trên giao diện
    if (moodTime) {
        moodTime.textContent = `${strPad(h)}:${strPad(m)}`;
    }

    // Nếu không kéo thanh trượt thủ công, bầu trời tự động đổi màu theo giờ thực tế trong ngày
    if (!slider || document.activeElement !== slider) {
        const decimalHour = h + m / 60 + s / 3600;
        // Ánh xạ chu kỳ bầu trời theo giờ địa phương:
        // 05:00 -> 0.0 (Bình minh)
        // 09:30 -> 0.28 (Buổi sáng)
        // 12:30 -> 0.50 (Buổi trưa nắng)
        // 16:45 -> 0.68 (Hoàng hôn chiều)
        // 18:30 -> 0.84 (Chạng vạng tối)
        // 20:30 - 04:59 -> 1.0 (Đêm trăng sao)
        if (decimalHour >= 5 && decimalHour < 20.5) {
            timeOfDay = (decimalHour - 5) / 15.5;
        } else {
            timeOfDay = 1.0;
        }
    }
}

function draw() {
    T += 0.016; 
    updateTimeFromLocalClock();

    const P = getPalette(timeOfDay);
    
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, rgb(P.skyTop)); 
    sky.addColorStop(1, rgb(P.skyHor));
    ctx.fillStyle = sky; 
    ctx.fillRect(0, 0, W, H);
    
    if (P.star > 0.01) { 
        stars.forEach((s) => { 
            const tw = 0.5 + 0.5 * Math.sin(T * 2 + s.tw); 
            ctx.fillStyle = rgb([255, 255, 255], P.star * tw * 0.9); 
            ctx.beginPath(); 
            ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); 
            ctx.fill(); 
        }); 
    }
    
    if (moodName) moodName.textContent = P.name;
    
    requestAnimationFrame(draw);
}

function strPad(n) { return String(n).padStart(2, "0"); } 
draw();