#!/usr/bin/env node
/**
 * 生产形态静态预览服务器（零依赖）
 *
 * 背景：`docusaurus serve` 对版本化文档的 index 路由存在缺陷
 * （/aas/1.0/ 返回 404，产物本身正常）。本服务器按生产托管
 * （nginx / 对象存储静态站）的标准行为预览 build/ 目录：
 *   - 目录请求 → 目录下 index.html
 *   - 以 index 结尾的 clean URL → 301 规范化到目录
 *   - 未命中 → 404.html（404 状态码）
 *
 * 用法：node scripts/serve-static.js [port]   （默认 3000）
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "build");
const PORT = Number(process.argv[2]) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webp": "image/webp",
};

function send(res, code, body, type) {
  res.writeHead(code, {"Content-Type": type || "text/html; charset=utf-8"});
  res.end(body);
}

function serveFile(res, filePath, code = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) return notFound(res);
    send(res, code, data, MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  });
}

function notFound(res) {
  const nf = path.join(ROOT, "404.html");
  fs.readFile(nf, (err, data) => {
    if (err) return send(res, 404, "404 Not Found", "text/plain; charset=utf-8");
    send(res, 404, data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch {
    return send(res, 400, "Bad Request", "text/plain");
  }
  // 阻断路径穿越
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) return notFound(res);

  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) {
      // 目录 → 目录内 index.html
      return serveFile(res, path.join(filePath, "index.html"));
    }
    if (!err && st.isFile()) {
      // */index（无扩展名）→ 301 规范化到目录
      if (path.basename(filePath) === "index" && !path.extname(filePath)) {
        res.writeHead(301, {Location: path.posix.join(path.posix.dirname(urlPath), "./")});
        return res.end();
      }
      return serveFile(res, filePath);
    }
    // 未命中：尝试clean url（/foo → foo.html）后回退 404
    const withHtml = filePath + ".html";
    fs.stat(withHtml, (e2, st2) => {
      if (!e2 && st2.isFile()) return serveFile(res, withHtml);
      notFound(res);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Static preview of build/ at http://localhost:${PORT} (Ctrl+C to stop)`);
});
