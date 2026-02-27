const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../frontend');
const PORT = Number(process.env.FRONTEND_PORT || 5501);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function safeResolve(urlPath) {
    const clean = decodeURIComponent(urlPath.split('?')[0]);
    const normalized = clean === '/' ? '/index.html' : clean;
    const full = path.join(ROOT, normalized);
    const resolved = path.resolve(full);
    if (!resolved.startsWith(path.resolve(ROOT))) return null;
    return resolved;
}

const server = http.createServer((req, res) => {
    const filePath = safeResolve(req.url || '/');
    if (!filePath) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    process.stdout.write(`Frontend static server running at http://localhost:${PORT}\n`);
});
