const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Sử dụng bộ lọc dữ liệu JSON đầu vào chuẩn
app.use(express.json());

let totalExecute = 0;
let eliteServers = new Map(); 

// Mã PlaceId của Sea 3 Blox Fruits
const SEA_3_PLACE_ID = "7449423635";

// 1. CỔNG TIẾP NHẬN DỮ LIỆU ELITE (BẮT KHÔNG TRƯỢT PHÁT NÀO)
app.post('/update-elite', (req, res) => {
    try {
        const { jobid, players, placeId, eliteName } = req.body;
        
        // Kiểm tra dữ liệu hợp lệ tối thiểu
        if (!jobid || !placeId) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin JobId hoặc PlaceId" });
        }

        // Bộ lọc bắt buộc: Chỉ nhận Sea 3
        if (String(placeId) !== SEA_3_PLACE_ID) {
            console.log(`⚠️ [Web] Từ chối do sai Sea (PlaceId nhận được: ${placeId})`);
            return res.status(200).json({ success: false, message: "Bỏ qua vì không phải Sea 3" });
        }

        // Tăng tổng số lần chạy script toàn cầu
        totalExecute++; 

        // Lưu hoặc cập nhật Server vào Map
        eliteServers.set(jobid, {
            "JobId": jobid,
            "Players": Number(players) || 1,
            "Script_Runners": totalExecute,
            "PlaceId": Number(placeId),
            "Elite_Name": eliteName || "Unknown Elite",
            "Name": "Elite Boss Sea 3",
            "UpdatedAt": Date.now()
        });

        console.log(`✅ [Web] Đã khóa mục tiêu Server! Boss: ${eliteName} | JobId: ${jobid}`);
        
        // Trả về JSON xác nhận thành công 100% để Script Lua biết và dừng thử lại
        return res.status(200).json({ success: true, message: "Web đã nhận dữ liệu thành công!" });

    } catch (error) {
        console.error("❌ [Web Lỗi Hệ Thống]:", error);
        return res.status(500).json({ success: false, message: "Lỗi xử lý máy chủ" });
    }
});

// 2. CỔNG API LẤY DỮ LIỆU CHO SCRIPT AUTO HOP
app.get('/api', (req, res) => {
    const eliteDataArray = Array.from(eliteServers.values());
    res.json(eliteDataArray);
});

// Tự động dọn dẹp các server cũ sau 6 phút (Quét dọn mỗi 1 phút)
setInterval(() => {
    const now = Date.now();
    for (let [jobid, data] of eliteServers.entries()) {
        if (now - data.UpdatedAt > 6 * 60 * 1000) { 
            console.log(`🧹 [Web] Hết hạn 6 phút, xóa Server: ${jobid}`);
            eliteServers.delete(jobid);
        }
    }
}, 60000); 

// 3. GIAO DIỆN HIỂN THỊ WEB GỐC
app.get('/', (req, res) => {
    const eliteDataArray = Array.from(eliteServers.values());
    const finalData = {
        "Total_Execute_Global": totalExecute,
        "By": "tranduykhanh",
        "Target": "Elite Boss Hunter",
        "Sea_Filter": "Only Sea 3 (7449423635)",
        "Total_Elite_Servers": eliteDataArray.length,
        "Elite_Data": eliteDataArray
    };

    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elite Server Tracker - Chặt Chẽ 100%</title>
        <style>
            body { background-color: #121212; color: #00ffcc; font-family: monospace; padding: 15px; margin: 0; }
            .controls { margin-bottom: 10px; font-size: 14px; color: #e0e0e0; user-select: none; }
            pre { background-color: #181818; padding: 10px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 13px; margin: 0; }
        </style>
    </head>
    <body>
        <div class="controls">
            <label><input type="checkbox" id="prettyPrint" checked onchange="renderJSON()"> Bản in đẹp JSON</label>
        </div>
        <pre id="jsonContent"></pre>
        <script>
            const rawData = ${JSON.stringify(finalData)};
            function renderJSON() {
                const isPretty = document.getElementById('prettyPrint').checked;
                const container = document.getElementById('jsonContent');
                container.textContent = isPretty ? JSON.stringify(rawData, null, 2) : JSON.stringify(rawData);
            }
            renderJSON();
            setTimeout(() => { location.reload(); }, 7000); // Tự reload sau 7 giây
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Web Tracker chạy mượt mà tại port ${PORT}`);
});
