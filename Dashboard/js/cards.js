document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".liquid-glass-card");
    cards.forEach((card) => {
      const canvas = card.querySelector(".glass-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      let width, height, mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
      const resize = () => { width = canvas.width = card.offsetWidth; height = canvas.height = card.offsetHeight; mouseX = targetX = width / 2; mouseY = targetY = height / 2; };
      resize(); window.addEventListener("resize", resize);
      card.addEventListener("mousemove", (e) => { const rect = card.getBoundingClientRect(); targetX = e.clientX - rect.left; targetY = e.clientY - rect.top; });
      const render = () => {
        mouseX += (targetX - mouseX) * 0.08; mouseY += (targetY - mouseY) * 0.08;
        ctx.clearRect(0, 0, width, height);
        const radius = Math.max(width, height) * 0.8;
        const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, radius);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.35)"); gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.1)"); gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
        const edgeGrad = ctx.createLinearGradient(0, 0, width, height);
        edgeGrad.addColorStop(0, "rgba(255, 255, 255, 0.5)"); edgeGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.05)"); edgeGrad.addColorStop(1, "rgba(255, 255, 255, 0.2)");
        ctx.strokeStyle = edgeGrad; ctx.lineWidth = 1.5; ctx.strokeRect(0, 0, width, height);
        requestAnimationFrame(render);
      }; render();
    });
});

// HÀM MỞ MODAL VÀ HIỂN THỊ BIỂU ĐỒ TƯƠNG ỨNG
function openChart(boxId) {
  // Hiện Modal
  document.getElementById('chart-modal').classList.add('active');
  
  // Tắt tất cả các biểu đồ đang hiển thị
  document.querySelectorAll('.chart-box').forEach(box => {
      box.classList.remove('active');
  });
  
  // Chỉ bật biểu đồ được truyền ID vào
  document.getElementById(boxId).classList.add('active');
  
  // MẸO QUAN TRỌNG: Kích hoạt sự kiện resize để Chart.js tự động giãn đồ thị vừa khít khung
  window.dispatchEvent(new Event('resize'));
}

// HÀM ĐÓNG MODAL
function closeChart() {
  document.getElementById('chart-modal').classList.remove('active');
}

// TỰ ĐỘNG XOAY XUÔI MŨI TÊN KHI NGƯỜI DÙNG ĐÃ CHỌN XONG
// (áp dụng cho mọi .glass-select: trạm, năm, tháng, ngày)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.glass-select').forEach((select) => {
      // Khi người dùng bấm vào mở danh sách -> Lật mũi tên lên
      select.addEventListener('mousedown', () => {
          select.classList.add('open');
      });

      // Khi người dùng đã chọn xong (hoặc bấm ra ngoài) -> Xoay xuôi mũi tên lại
      select.addEventListener('change', () => {
          select.classList.remove('open');
          select.blur(); // Bỏ focus khỏi ô select
      });

      select.addEventListener('blur', () => {
          select.classList.remove('open');
      });
  });
});