const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Khởi tạo biến lưu trữ máy chủ có Elite Boss
let totalExecute = 0;
let eliteServers = new Map(); 

// Nhận diện Sea hiển thị trên giao diện JSON cho đẹp
function getSeaName(placeId) {
    const id = String(placeId);
    if (id === "2753915549") return "Elite Tracker Sea 1";
    if (id === "4442272183") return "Elite Tracker Sea 2";
    if (id === "7449423635") return "Elite Tracker Sea 3 (Main)";
    return `Elite Server (Place: ${id})`;
}

// 1. Cổng tiếp nhận dữ liệu từ các Server Roblox gửi lên
app.post('/update-elite', (req, res) => {
    const { jobid, players, placeId } = req.body;
    
    if (!jobid) {
        return res.status(400).send("Missing JobId");
    }

    totalExecute++; 

    // Lưu dữ liệu máy chủ vào Map
    eliteServers.set(jobid, {
        "placeId": Number(placeId) || 0,
        "jobId": jobid,
        "players": Number(players) || 1,
        "name": getSeaName(placeId),
        "updatedAt": Date.now()
    });

    res.status(200).send("Elite Server Updated!");
});

// 2. API dành riêng cho Script Lua lấy danh sách Server về để Auto Hop
app.get('/api', (req, res) => {
    const eliteDataArray = Array.from(eliteServers.values());
    res.json(eliteDataArray);
});

// Cơ chế dọn dẹp: Tự động xóa server khỏi danh sách sau 15 phút
setInterval(() => {
    const now = Date.now();
    for (let [jobid, data] of eliteServers.entries()) {
        if (now - data.updatedAt > 15 * 60 * 1000) { 
            eliteServers.delete(jobid);
        }
    }
}, 60000); 

// 3. Giao diện hiển thị gốc (Dạng JSON trực quan)
app.get('/', (req, res) => {
    const eliteDataArray = Array.from(eliteServers.values());
    
    const finalData = {
        "Total Execute": totalExecute,
        "by": "tranduykhanh",
        "tracker_target": "Elite Boss (Deandre, Diablo, Urban)",
        "total_elite_servers": eliteDataArray.length,
        "elite_data": eliteDataArray
    };

    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elite Boss Server Tracker</title>
        <style>
            body {
                background-color: #121212;
                color: #00ffff;
                font-family: monospace;
                padding: 15px;
                margin: 0;
            }
            .controls {
                margin-bottom: 10px;
                font-size: 14px;
                user-select: none;
                color: #e0e0e0;
            }
            pre {
                background-color: #181818;
                padding: 10px;
                border-radius: 4px;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 13px;
                margin: 0;
                border: 1px solid #00ffff;
                color: #fff;
            }
        </style>
    </head>
    <body>
        <div class="controls">
            <label>
                <input type="checkbox" id="prettyPrint" checked onchange="renderJSON()"> Định dạng bản in đẹp (Cyan Neon)
            </label>
        </div>
        <pre id="jsonContent"></pre>

        <script>
            const rawData = ${JSON.stringify(finalData)};
            
            function renderJSON() {
                const isPretty = document.getElementById('prettyPrint').checked;
                const container = document.getElementById('jsonContent');
                if (isPretty) {
                    container.textContent = JSON.stringify(rawData, null, 2);
                } else {
                    container.textContent = JSON.stringify(rawData);
                }
            }
            
            renderJSON();

            // Tự động reload sau mỗi 8 giây để cập nhật danh sách mới
            setTimeout(() => {
                location.reload();
            }, 8000);
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 [Elite-Web] Đang chạy tại port ${PORT}`);
});

