import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { createReadStream, watch } from 'node:fs';
import { resolve, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');
const clients = new Set();
const serverId = Date.now();
const liveReload = `<script>
(() => {
  const updates = new EventSource('/__dev/events');
  let connectedServer;
  updates.addEventListener('ready', event => {
    if (connectedServer && connectedServer !== event.data) location.reload();
    connectedServer = event.data;
  });
  updates.addEventListener('change', event => {
    const files = JSON.parse(event.data);
    if (!files.every(file => file.endsWith('.css'))) { location.reload(); return; }
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const url = new URL(link.href);
      if (url.origin !== location.origin) return;
      if (!files.includes(decodeURIComponent(url.pathname).slice(1))) return;
      const replacement = link.cloneNode();
      url.searchParams.set('_dev', Date.now());
      replacement.href = url.href;
      replacement.onload = () => link.remove();
      replacement.onerror = () => replacement.remove();
      link.after(replacement);
    });
  });
})();
</script>`;
let refreshTimer;
const changedFiles = new Set();
const watcher = watch(root, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  changedFiles.add(filename.toString().replaceAll('\\', '/'));
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    const message = 'event: change\ndata: ' + JSON.stringify([...changedFiles]) + '\n\n';
    for (const client of clients) client.write(message);
    changedFiles.clear();
  }, 120);
});
watcher.on('error', error => console.error('Live refresh watcher:', error.message));
const heartbeat = setInterval(() => { for (const client of clients) client.write(': heartbeat\n\n'); }, 15000);
heartbeat.unref();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/__dev/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write('event: ready\ndata: ' + serverId + '\n\n');
      clients.add(res);
      res.on('close', () => clients.delete(res));
      return;
    }
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403); return res.end('Forbidden'); }
    const info = await stat(path);
    if (!info.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const headers = { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    if (extname(path) === '.html') {
      const html = (await readFile(path, 'utf8')).replace('</body>', liveReload + '</body>');
      res.writeHead(200, { ...headers, 'Content-Length': Buffer.byteLength(html) });
      return res.end(req.method === 'HEAD' ? undefined : html);
    }
    let start = 0, end = info.size - 1, status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); return res.end(); }
      start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
      if (start > end || start >= info.size) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); return res.end(); }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') return res.end();
    const stream = createReadStream(path, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('error', error => {
  if (error.code === 'EADDRINUSE') console.error('The preview port is already in use. Open http://127.0.0.1:4173 instead of starting another server.');
  else console.error(error.message);
  watcher.close();
  process.exitCode = 1;
});
server.listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173\nLive refresh enabled. Save CSS to update styles without restarting the film.'));
