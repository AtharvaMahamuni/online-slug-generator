import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Apple Touch Icon (180x180)
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 180px;
      height: 180px;
      background: linear-gradient(135deg, #ff5e13 0%, #d04200 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .highlight {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: rgba(255, 255, 255, 0.35);
    }
    svg {
      width: 110px;
      height: 110px;
    }
  </style>
</head>
<body>
  <div class="highlight"></div>
  <svg viewBox="0 0 32 32" fill="none">
    <rect x="4" y="10" width="10" height="12" rx="3.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
    <rect x="18" y="10" width="10" height="12" rx="3.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
    <line x1="12" y1="16" x2="20" y2="16" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
  </svg>
</body>
</html>`);
  await page.screenshot({ path: path.join(publicDir, "apple-touch-icon.png") });
  console.log("Generated apple-touch-icon.png (180x180)");

  // 2. Icon 192 (192x192)
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 192px;
      height: 192px;
      background: linear-gradient(135deg, #ff5e13 0%, #d04200 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    svg {
      width: 120px;
      height: 120px;
    }
  </style>
</head>
<body>
  <svg viewBox="0 0 32 32" fill="none">
    <rect x="4" y="10" width="10" height="12" rx="3.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
    <rect x="18" y="10" width="10" height="12" rx="3.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
    <line x1="12" y1="16" x2="20" y2="16" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
  </svg>
</body>
</html>`);
  await page.screenshot({ path: path.join(publicDir, "icon-192.png") });
  console.log("Generated icon-192.png (192x192)");

  // 3. Icon 512 (512x512)
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 512px;
      height: 512px;
      background: linear-gradient(135deg, #ff5e13 0%, #d04200 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    svg {
      width: 320px;
      height: 320px;
    }
  </style>
</head>
<body>
  <svg viewBox="0 0 32 32" fill="none">
    <rect x="4" y="10" width="10" height="12" rx="3.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
    <rect x="18" y="10" width="10" height="12" rx="3.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
    <line x1="12" y1="16" x2="20" y2="16" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
  </svg>
</body>
</html>`);
  await page.screenshot({ path: path.join(publicDir, "icon-512.png") });
  console.log("Generated icon-512.png (512x512)");

  // 4. OpenGraph Social Card (1200x630)
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      background-color: #f7f7f4;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #26251e;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 72px;
      position: relative;
      overflow: hidden;
    }
    .frame-border {
      position: absolute;
      inset: 20px;
      border: 1px solid #e6e5e0;
      border-radius: 16px;
      pointer-events: none;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-badge {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff5e13 0%, #d04200 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(245, 78, 0, 0.25);
    }
    .logo-badge svg {
      width: 30px;
      height: 30px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #26251e;
    }
    .badge-tag {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 6px 14px;
      background: #fafaf7;
      border: 1px solid #cfcdc4;
      border-radius: 20px;
      color: #5a5852;
    }
    .main {
      margin-top: 10px;
      z-index: 1;
    }
    .headline {
      font-size: 52px;
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -1.5px;
      color: #26251e;
      max-width: 980px;
      margin-bottom: 34px;
    }
    .preview-card {
      background: #ffffff;
      border: 1px solid #e6e5e0;
      border-radius: 14px;
      padding: 24px 32px;
      display: flex;
      align-items: center;
      gap: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
    .preview-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .preview-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #807d72;
    }
    .preview-text {
      font-size: 21px;
      font-weight: 500;
      color: #26251e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .arrow {
      font-size: 28px;
      color: #f54e00;
      font-weight: 600;
      flex-shrink: 0;
    }
    .slug-box {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 21px;
      font-weight: 500;
      color: #f54e00;
      background: #fafaf7;
      border: 1px solid #e6e5e0;
      padding: 6px 14px;
      border-radius: 8px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1;
      padding-top: 10px;
    }
    .pills {
      display: flex;
      gap: 12px;
    }
    .pill {
      font-size: 14px;
      font-weight: 500;
      color: #5a5852;
      background: #ffffff;
      border: 1px solid #e6e5e0;
      padding: 6px 14px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f54e00;
    }
    .author {
      font-size: 15px;
      font-weight: 600;
      color: #807d72;
    }
  </style>
</head>
<body>
  <div class="frame-border"></div>
  <div class="header">
    <div class="brand">
      <div class="logo-badge">
        <svg viewBox="0 0 32 32" fill="none">
          <rect x="4" y="10" width="10" height="12" rx="3.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
          <rect x="18" y="10" width="10" height="12" rx="3.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
          <line x1="12" y1="16" x2="20" y2="16" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="brand-title">Online Slug Generator</span>
    </div>
    <span class="badge-tag">Free · Privacy-First · In-Browser</span>
  </div>
  <div class="main">
    <h1 class="headline">Turn titles &amp; lists into clean, readable URL slugs.</h1>
    <div class="preview-card">
      <div class="preview-col">
        <span class="preview-label">Input Title</span>
        <span class="preview-text">How to Prune Roses in June</span>
      </div>
      <div class="arrow">&rarr;</div>
      <div class="preview-col">
        <span class="preview-label">Clean URL Slug</span>
        <div><span class="slug-box">how-to-prune-roses-in-june</span></div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="pills">
      <div class="pill"><span class="pill-dot"></span> 100% Client-Side Engine</div>
      <div class="pill"><span class="pill-dot"></span> Zero Server Uploads</div>
      <div class="pill"><span class="pill-dot"></span> Single &amp; Bulk Mode</div>
      <div class="pill"><span class="pill-dot"></span> Zero Ads &amp; Trackers</div>
    </div>
    <span class="author">onlinesluggenerator.com</span>
  </div>
</body>
</html>`);
  await page.screenshot({ path: path.join(publicDir, "og-image.png") });
  console.log("Generated og-image.png (1200x630)");

  await browser.close();
  console.log("All visual assets successfully generated.");
}

generate().catch((err) => {
  console.error("Asset generation error:", err);
  process.exit(1);
});
