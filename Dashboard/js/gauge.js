/**
 * gauge.js
 * --------
 * Quản lý đồng hồ tròn AQI (Glass Circular Gauge) - CHẾ ĐỘ HIỂN THỊ CỐ ĐỊNH:
 * - Hiển thị chỉ số AQI chính xác theo dữ liệu quan trắc thực tế & dự báo ML
 * - Kim quay (thumb) mượt mà tới đúng mốc AQI tương ứng
 * - Không cho phép kéo hoặc tự ý điều chỉnh thủ công để đảm bảo tính khách quan của dữ liệu quan trắc
 */

document.addEventListener("DOMContentLoaded", () => {
    const thumbContainer = document.getElementById('thumb-container');
    const thumb = document.getElementById('thumb');
    const aqiVal = document.getElementById('aqi-val');
    const aqiStatus = document.getElementById('aqi-status');
    const aqiBadge = document.getElementById('aqi-badge');

    // 1. Phân bổ 6 mức độ chuẩn EPA trên dải cung 240 độ
    const breakpoints = [
        { aqi: 0,   progress: 0 },
        { aqi: 50,  progress: 1/6 },
        { aqi: 100, progress: 2/6 },
        { aqi: 150, progress: 3/6 },
        { aqi: 200, progress: 4/6 },
        { aqi: 300, progress: 5/6 },
        { aqi: 500, progress: 1 }
    ];

    function getAQIInfo(val) {
        if (val <= 50) return { 
            label: 'Tốt', color: '#10b981', rgb: '16, 185, 129',
            advice: 'Không khí trong lành, lý tưởng. Mọi người có thể thoải mái tham gia các hoạt động thể chất và đi lại ngoài trời.' 
        };         
        if (val <= 100) return { 
            label: 'Trung bình', color: '#facc15', rgb: '250, 204, 21',
            advice: 'Chất lượng không khí ở mức chấp nhận được. Nhóm người cực kỳ nhạy cảm nên chú ý hạn chế ở ngoài trời quá lâu lúc kẹt xe.' 
        }; 
        if (val <= 150) return { 
            label: 'Kém', color: '#fb923c', rgb: '251, 146, 60',
            advice: 'Cảnh báo sớm: Nhóm nhạy cảm (trẻ em, người già, người có bệnh lý hô hấp) cần hạn chế hoạt động thể lực ngoài trời.' 
        };        
        if (val <= 200) return { 
            label: 'Xấu', color: '#f87171', rgb: '248, 113, 113',
            advice: 'Cảnh báo toàn dân: Mọi người nên đeo khẩu trang lọc bụi khi ra ngoài. Nhóm nhạy cảm nên ở trong nhà.' 
        };          
        if (val <= 300) return { 
            label: 'Rất xấu', color: '#a855f7', rgb: '168, 85, 247',
            advice: 'Cảnh báo khẩn cấp: Hạn chế tối đa ra ngoài, đóng kín cửa sổ và bật máy lọc không khí trong nhà.' 
        };   
        return { 
            label: 'Nguy hại', color: '#e11d48', rgb: '225, 29, 72',
            advice: 'Báo động cấp độ cao: Tránh mọi hoạt động thể lực ngoài trời. Đóng kín cửa sổ và lọc không khí liên tục.' 
        };                    
    }

    // 2. Tính góc quay từ số AQI (-120 độ đến +120 độ)
    function calculateRotation(aqi) {
        let progress = 0;
        for (let i = 0; i < breakpoints.length - 1; i++) {
            let lower = breakpoints[i];
            let upper = breakpoints[i+1];
            if (aqi >= lower.aqi && aqi <= upper.aqi) {
                let ratio = (aqi - lower.aqi) / (upper.aqi - lower.aqi);
                progress = lower.progress + ratio * (upper.progress - lower.progress);
                break;
            }
        }
        if (aqi > 500) progress = 1;
        return progress * 240 - 120;
    }

    // 3. Cập nhật giao diện đồng hồ theo số liệu quan trắc cố định
    function updateUI(aqi) {
        const val = Math.max(0, Math.min(500, Math.round(aqi)));
        const info = getAQIInfo(val);

        if (aqiVal) aqiVal.textContent = val;
        if (aqiStatus) {
            aqiStatus.textContent = info.label;
            aqiStatus.style.color = info.color;
        }
        if (aqiBadge) {
            aqiBadge.style.borderColor = `rgba(${info.rgb}, 0.45)`;
            aqiBadge.style.backgroundColor = `rgba(${info.rgb}, 0.15)`;
            aqiBadge.style.boxShadow = `0 0 14px rgba(${info.rgb}, 0.25)`;
        }
        if (thumb) {
            thumb.style.borderColor = info.color;
            thumb.style.boxShadow = `0 0 16px rgba(${info.rgb}, 0.8), 0 4px 12px rgba(0, 0, 0, 0.6)`;
        }

        // Quay kim đo mượt mà đến đúng vị trí
        const rotation = calculateRotation(val);
        if (thumbContainer) {
            thumbContainer.style.transform = `rotate(${rotation}deg)`;
        }
    }

    // Hàm public được charts.js gọi khi đổi trạm hoặc đổi ngày xem
    window.AQIGaugeSet = function(aqi) {
        updateUI(aqi);
    };

    updateUI(45);
});