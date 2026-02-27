const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 5173;
const ROOT = path.resolve(__dirname, '..', '.tmp_clr_epub');
const PUBLIC = path.resolve(__dirname, 'public');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ncx': 'application/xml; charset=utf-8',
  '.opf': 'application/xml; charset=utf-8',
  '.otf': 'font/otf'
};

function safeResolve(base, target) {
  const clean = target.replace(/^\/+/, '');
  const abs = path.resolve(base, clean);
  return abs.startsWith(base) ? abs : null;
}

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
}

function buildTree(dir, rel = '') {
  const full = path.join(dir, rel);
  const entries = fs.readdirSync(full, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.'))
    .map((e) => {
      const entryRel = path.join(rel, e.name).replace(/\\/g, '/');
      if (e.isDirectory()) {
        return {
          type: 'dir',
          name: e.name,
          path: entryRel,
          children: buildTree(dir, entryRel)
        };
      }
      return {
        type: 'file',
        name: e.name,
        path: entryRel
      };
    });

  // Directories first, then files; both alphabetical
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return entries;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/tree') {
    const tree = buildTree(ROOT);
    return send(res, 200, JSON.stringify(tree), 'application/json; charset=utf-8');
  }

  if (url.pathname.startsWith('/epub/')) {
    const rel = url.pathname.replace('/epub/', '');
    const abs = safeResolve(ROOT, rel);
    if (!abs) return send(res, 400, 'Bad path');
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      return send(res, 404, 'Not found');
    }
    const ext = path.extname(abs).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(abs).pipe(res);
    return;
  }

  const page = url.pathname === '/' ? '/index.html' : url.pathname;
  const abs = safeResolve(PUBLIC, page);
  if (!abs || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    return send(res, 404, 'Not found');
  }
  const ext = path.extname(abs).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'text/plain; charset=utf-8';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(abs).pipe(res);
});

server.listen(PORT, () => {
  console.log(`epub-preview running: http://localhost:${PORT}`);
  console.log(`serving epub root: ${ROOT}`);
});
