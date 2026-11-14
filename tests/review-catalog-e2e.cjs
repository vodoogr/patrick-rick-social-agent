// Run only against the explicitly identified isolated validation branch.
// The connection string is read from stdin and never printed or saved.
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const net = require('node:net');
const assert = require('node:assert/strict');

async function main() {
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  const reader = require('node:readline').createInterface({ input:process.stdin, terminal:false });
  const input = await new Promise(resolve => reader.once('line', resolve));
  reader.close();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  const config = JSON.parse(input);
  assert.equal(config.branch, 'br-ancient-hill-b9o9k7e7');
  assert.match(config.databaseUrl, /^postgres(?:ql)?:\/\//);
  const probe = net.createServer();
  await new Promise((resolve, reject) => probe.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const token = randomBytes(32).toString('hex');
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    env: { ...process.env, DATABASE_URL: config.databaseUrl, PATRICK_MCP_AUTH_MODE: 'static', AGENT_MCP_TOKEN: token,
      BETTER_AUTH_SECRET: randomBytes(32).toString('hex'), PATRICK_APP_ORIGIN: origin },
    stdio: 'ignore', windowsHide: true,
  });
  const endpoint = `${origin}/api/mcp`;
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (child.exitCode !== null) throw new Error('Test server stopped before becoming ready');
      try { const r = await fetch(endpoint, { method:'POST' }); if (r.status === 401) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    assert.ok(ready, 'Server did not become ready or failed unauthenticated rejection');
    let sequence = 0;
    async function rpc(method, params) {
      const r = await fetch(endpoint, { method:'POST', headers: { authorization:`Bearer ${token}`, 'content-type':'application/json',
        accept:'application/json, text/event-stream', 'mcp-protocol-version':'2026-07-28', 'mcp-method':method,
        ...(params.name ? {'mcp-name':params.name} : {}) },
        body:JSON.stringify({jsonrpc:'2.0', id:++sequence, method, params:{...params,_meta:{'io.modelcontextprotocol/protocolVersion':'2026-07-28','io.modelcontextprotocol/clientCapabilities':{},'io.modelcontextprotocol/clientInfo':{name:'review-test',version:'1.0'}}}}) });
      const body = await r.text();
      assert.equal(r.status, 200, `HTTP failure for ${method}: ${body.slice(0, 350)}`);
      const line = body.split('\n').find(x => x.startsWith('data:'));
      const msg = JSON.parse(line ? line.slice(5).trim() : body);
      assert.ok(!msg.error, `RPC error for ${method}`);
      return msg.result;
    }
    const tools = await rpc('tools/list', {});
    for (const name of ['review_catalog_summary','list_review_albums','get_review_album_tracks'])
      assert.ok(tools.tools.some(t => t.name === name), `${name} missing`);
    async function call(name, args) {
      const value = await rpc('tools/call', {name, arguments:args});
      assert.ok(!value.isError, `${name} returned an error`);
      return JSON.parse(value.content[0].text);
    }
    const summary = await call('review_catalog_summary', {});
    assert.equal(summary.coverage.album_entries, 34);
    assert.equal(summary.coverage.track_positions, 543);
    assert.equal(summary.manifest.project.state, 'en desarrollo');
    assert.equal(summary.manifest.project.tracklist, null);
    const albums = await call('list_review_albums', { query:'Only at Night', limit:50 });
    assert.equal(albums.albums.length, 1);
    const detail = await call('get_review_album_tracks', { album_id:albums.albums[0].album_id });
    assert.equal(detail.tracks.length, 15);
    assert.equal(detail.tracks[0].titulo_visible_sin_prefijo, 'PRELUDE IN PURPLE');
    const chris = await call('list_review_albums', { query:'Your Side', limit:50 });
    const chrisDetail = await call('get_review_album_tracks', {album_id:chris.albums[0].album_id});
    assert.equal(chrisDetail.tracks[2].titulo_visible_sin_prefijo, 'Almost - Chris Rick y Patrick Rick');
    assert.equal(chrisDetail.tracks[2].duracion_m_ss, null);
    const invalid = await rpc('tools/call', {name:'get_review_album_tracks', arguments:{album_id:'invalid'}});
    assert.ok(invalid.isError, 'Invalid album id should be rejected');
    process.stdout.write('PASS: unauthorized rejected; three tools available; counts, Unplugged II, album order, correction and validation verified.\n');
  } finally { child.kill(); }
}
main().catch(e => { process.stderr.write(`FAIL: ${e.message}\n`); process.exitCode=1; });

