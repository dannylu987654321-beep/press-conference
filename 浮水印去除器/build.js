const fs = require('fs');
const https = require('https');
const path = 'f:\\\\trae2\\\\press-conference-project\\\\浮水印去除器\\\\index.html';

https.get('https://raw.githubusercontent.com/allenk/GeminiWatermarkTool/main/assets/embedded_assets.hpp', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const p48 = data.match(/bg_48_png\[\] = \{([^}]+)\}/)[1];
    const p96 = data.match(/bg_96_png\[\] = \{([^}]+)\}/)[1];
    const b48 = Buffer.from(p48.split(',').map(x => parseInt(x.trim(), 16)).filter(x => !isNaN(x))).toString('base64');
    const b96 = Buffer.from(p96.split(',').map(x => parseInt(x.trim(), 16)).filter(x => !isNaN(x))).toString('base64');
    
    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini 浮水印去除器 (Web 版)</title>
    <style>
        :root {
            --bg-color: #0f172a;
            --panel-bg: rgba(30, 41, 59, 0.7);
            --border-color: rgba(255, 255, 255, 0.1);
            --accent-color: #3b82f6;
            --accent-hover: #2563eb;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        body { background-color: var(--bg-color); color: var(--text-main); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 2rem; background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%); }
        h1 { margin-bottom: 0.5rem; font-weight: 600; letter-spacing: -0.025em; text-align: center; }
        p.subtitle { color: var(--text-muted); margin-bottom: 2rem; text-align: center; }
        
        .container { width: 100%; max-width: 900px; background: var(--panel-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--border-color); border-radius: 1rem; padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        
        /* Upload Area */
        .upload-area { border: 2px dashed var(--border-color); border-radius: 0.75rem; padding: 3rem 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; }
        .upload-area:hover, .upload-area.dragover { border-color: var(--accent-color); background: rgba(59, 130, 246, 0.05); }
        .upload-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.8; }
        #fileInput { display: none; }
        
        /* Workspace (Preview & Controls) */
        .workspace { display: none; flex-direction: column; gap: 1.5rem; }
        .preview-container { position: relative; width: 100%; border-radius: 0.5rem; overflow: hidden; background: #000; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; justify-content: center; align-items: center; min-height: 300px;}
        canvas { max-width: 100%; max-height: 60vh; object-fit: contain; display: block; }
        
        .controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
        .btn { background: var(--accent-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
        .btn:hover { background: var(--accent-hover); }
        .btn-secondary { background: rgba(255, 255, 255, 0.1); }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }
        
        .options { display: flex; gap: 1rem; align-items: center; }
        select { background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.25rem; outline: none; }
        
        /* Loading Overlay */
        .loading { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; color: white; font-size: 1.2rem; display: none; z-index: 10; backdrop-filter: blur(4px); }
        .spinner { border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-right: 10px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        /* Slider */
        .slider-container { position: relative; width: 100%; max-width: 300px; display: flex; align-items: center; gap: 1rem; }
        .slider-container label { font-size: 0.9rem; color: var(--text-muted); white-space: nowrap; }
        input[type=range] { flex: 1; accent-color: var(--accent-color); }
        
        @media (max-width: 600px) {
            .controls { flex-direction: column; align-items: stretch; }
            .options { flex-direction: column; align-items: stretch; }
            .slider-container { max-width: 100%; }
        }
    </style>
</head>
<body>

    <h1>Gemini 浮水印去除器</h1>
    <p class="subtitle">100% 本地端處理，透過反向 Alpha 混合精確還原像素</p>

    <div class="container">
        <!-- Upload State -->
        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📥</div>
            <h2>點擊或拖放圖片至此</h2>
            <p style="color: var(--text-muted); margin-top: 0.5rem;">支援 JPG, PNG, WebP (處理在瀏覽器本地完成，保護隱私)</p>
            <input type="file" id="fileInput" accept="image/png, image/jpeg, image/webp, image/bmp">
        </div>

        <!-- Workspace State -->
        <div class="workspace" id="workspace">
            <div class="preview-container">
                <canvas id="imageCanvas"></canvas>
                <div class="loading" id="loadingOverlay">
                    <div class="spinner"></div>
                    <span>處理中...</span>
                </div>
            </div>
            
            <div class="slider-container">
                <label>對比 (Before/After)</label>
                <input type="range" id="compareSlider" min="0" max="100" value="100">
            </div>

            <div class="controls">
                <button class="btn btn-secondary" id="btnReset">🔄 重新上傳</button>
                <div class="options">
                    <label style="font-size: 0.9rem; color: var(--text-muted);">輸出格式:</label>
                    <select id="formatSelect">
                        <option value="image/png">PNG (無損)</option>
                        <option value="image/jpeg">JPEG (高畫質)</option>
                        <option value="image/webp">WebP</option>
                    </select>
                    <button class="btn" id="btnDownload">💾 下載圖片</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // --- 1. Embedded Alpha Masks ---
        const b64_48 = "${b48}";
        const b64_96 = "${b96}";

        // --- 2. Watermark Engine ---
        class WatermarkEngine {
            constructor() {
                this.alpha48 = null;
                this.alpha96 = null;
            }

            async init() {
                this.alpha48 = await this.decodeAlphaMap(b64_48, 48);
                this.alpha96 = await this.decodeAlphaMap(b64_96, 96);
            }

            decodeAlphaMap(base64Str, size) {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const data = ctx.getImageData(0, 0, size, size).data;
                        const alphaMap = new Float32Array(size * size);
                        for (let i = 0; i < size * size; i++) {
                            // alpha = max(R, G, B) / 255
                            const r = data[i * 4];
                            const g = data[i * 4 + 1];
                            const b = data[i * 4 + 2];
                            alphaMap[i] = Math.max(r, g, b) / 255.0;
                        }
                        resolve(alphaMap);
                    };
                    img.src = 'data:image/png;base64,' + base64Str;
                });
            }

            process(imageData) {
                const w = imageData.width;
                const h = imageData.height;
                let size = 48;
                let margin = 32;
                let alphaMap = this.alpha48;

                if (w > 1024 && h > 1024) {
                    size = 96;
                    margin = 64;
                    alphaMap = this.alpha96;
                }

                const startX = w - margin - size;
                const startY = h - margin - size;
                const pixels = imageData.data;
                const logoValue = 255.0;

                for (let row = 0; row < size; row++) {
                    for (let col = 0; col < size; col++) {
                        const alpha = alphaMap[row * size + col];
                        if (alpha < 0.002) continue; // Skip if no watermark influence

                        const a = Math.min(alpha, 0.99); // Prevent division by zero
                        const oneMinusA = 1.0 - a;

                        const px = startX + col;
                        const py = startY + row;
                        
                        if (px < 0 || px >= w || py < 0 || py >= h) continue;

                        const idx = (py * w + px) * 4;

                        // Reverse Alpha Blending: original = (watermarked - alpha * logo) / (1 - alpha)
                        for (let c = 0; c < 3; c++) {
                            const watermarked = pixels[idx + c];
                            const original = (watermarked - a * logoValue) / oneMinusA;
                            pixels[idx + c] = Math.max(0, Math.min(255, Math.round(original)));
                        }
                    }
                }
                return imageData;
            }
        }

        // --- 3. App Logic & UI ---
        document.addEventListener('DOMContentLoaded', async () => {
            const engine = new WatermarkEngine();
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const workspace = document.getElementById('workspace');
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const btnReset = document.getElementById('btnReset');
            const btnDownload = document.getElementById('btnDownload');
            const loadingOverlay = document.getElementById('loadingOverlay');
            const compareSlider = document.getElementById('compareSlider');
            const formatSelect = document.getElementById('formatSelect');

            let originalImage = null;
            let processedImageData = null;
            let originalImageData = null;
            let currentFilename = 'image.png';

            // Initialize Engine
            await engine.init();

            // Setup Drag & Drop
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFile(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
            });

            function handleFile(file) {
                if (!file.type.startsWith('image/')) {
                    alert('請上傳圖片檔案！');
                    return;
                }
                currentFilename = file.name.replace(/\.[^/.]+$/, ""); // remove extension
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        originalImage = img;
                        startProcessing();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            function startProcessing() {
                uploadArea.style.display = 'none';
                workspace.style.display = 'flex';
                loadingOverlay.style.display = 'flex';
                
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;
                ctx.drawImage(originalImage, 0, 0);
                
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                compareSlider.value = 100;

                // Use requestAnimationFrame to allow UI to update loading state before blocking thread
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        try {
                            const dataToProcess = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            processedImageData = engine.process(dataToProcess);
                            ctx.putImageData(processedImageData, 0, 0);
                        } catch (err) {
                            alert('處理圖片時發生錯誤');
                            console.error(err);
                        } finally {
                            loadingOverlay.style.display = 'none';
                        }
                    });
                });
            }

            // Before/After Slider
            compareSlider.addEventListener('input', (e) => {
                if (!originalImageData || !processedImageData) return;
                const percentage = parseInt(e.target.value) / 100; // 0 = original, 1 = processed
                
                if (percentage === 1) {
                    ctx.putImageData(processedImageData, 0, 0);
                } else if (percentage === 0) {
                    ctx.putImageData(originalImageData, 0, 0);
                } else {
                    ctx.putImageData(originalImageData, 0, 0);
                    
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    tempCanvas.getContext('2d').putImageData(processedImageData, 0, 0);
                    
                    const splitX = canvas.width * (1 - percentage);
                    ctx.drawImage(tempCanvas, splitX, 0, canvas.width - splitX, canvas.height, splitX, 0, canvas.width - splitX, canvas.height);
                    
                    ctx.fillStyle = 'var(--accent-color)';
                    ctx.fillRect(splitX - 1, 0, 2, canvas.height);
                }
            });

            // Reset
            btnReset.addEventListener('click', () => {
                workspace.style.display = 'none';
                uploadArea.style.display = 'flex';
                fileInput.value = '';
                originalImageData = null;
                processedImageData = null;
            });

            // Download
            btnDownload.addEventListener('click', () => {
                if (!processedImageData) return;
                ctx.putImageData(processedImageData, 0, 0);
                compareSlider.value = 100;
                
                const format = formatSelect.value;
                const ext = format.split('/')[1];
                let quality = 1.0;
                if (format === 'image/jpeg') quality = 0.95;
                
                const dataUrl = canvas.toDataURL(format, quality);
                const link = document.createElement('a');
                link.download = \`\${currentFilename}_cleaned.\${ext}\`;
                link.href = dataUrl;
                link.click();
            });
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync(path, html);
    console.log('Successfully created index.html');
  });
});
