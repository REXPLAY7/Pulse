// ================= CONFIG =================
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let W = 1280;
const H = 720, MID = H / 2, BORDER = 20, PX = 300, PR = 14, BEAT = 0.5;
let VIEW = 1; // escala lógica → pixels
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const SHAPES = ['square', 'diamond', 'circle', 'triangle'];

// ================= SAVE =================
const save = JSON.parse(localStorage.getItem('pulse_save') || '{"unlocked":1,"stars":{},"best":0}');
const store = () => localStorage.setItem('pulse_save', JSON.stringify(save));

// ================= NÍVEIS (DADOS) =================
const T = (len, gap, cy0, cy1 = cy0) => ({ type: 'tunnel', len, gap, cy0, cy1 });
const O = len => ({ type: 'open', len });
const I = (shape, y, size, extra = {}) => ({ type: 'island', shape, y, size, ...extra });
const P = () => ({ type: 'pink' });

const LEVELS = [
  { name: 'Primeiro Pulso', speed: 420, hue: 185, stars: [15, 30], segs: [
    O(600), T(600,320,360), T(500,320,360,250), T(500,320,250,450), T(500,300,450,360),
    T(600,300,360,260), T(600,280,260,460), T(500,280,460,360), O(300),
    T(600,260,360,300), T(600,260,300,420) ]},
  { name: 'Ilhas', speed: 450, hue: 160, stars: [15, 30], segs: [
    O(600), T(600,320,360), O(250), I('square',360,90), O(350), T(500,300,360),
    O(250), I('square',300,90), O(200), I('square',420,90), T(600,280,360,280),
    O(250), I('square',360,120), O(150), I('square',250,80), I('square',470,80),
    T(600,260,360) ]},
  { name: 'Formas', speed: 460, hue: 260, stars: [20, 40], segs: [
    O(600), I('diamond',360,100), O(200), I('circle',360,100), O(200), I('triangle',360,110),
    T(500,300,360), I('diamond',360,70,{gap:320}), I('circle',360,70,{gap:320}),
    T(400,300,360,300), I('triangle',300,70,{gap:320,cy:300}), O(250),
    I('diamond',260,90), I('circle',460,90), I('square',260,90), T(600,260,360) ]},
  { name: 'Ritmo', speed: 480, hue: 320, pinkEvery: 4, stars: [50, 65], segs: [
    O(700), P(), O(500), T(500,300,360), O(300), P(), O(400), P(),
    T(500,300,360,280), O(300), I('circle',360,90), O(200), P(), O(300),
    I('diamond',360,90), P(), T(600,280,360) ]},
  { name: 'Dois Caminhos', speed: 490, hue: 30, stars: [25, 45], segs: [
    O(600), T(500,320,360), I('square',360,70,{gap:320}), T(300,320,360),
    I('circle',360,80,{gap:340}), O(300), T(500,300,360,300),
    I('diamond',300,70,{gap:320,cy:300}), T(400,320,300,400),
    I('triangle',400,70,{gap:320,cy:400}), T(400,320,400,360),
    I('square',360,90,{gap:360}), T(500,280,360) ]},
  { name: 'Maré', speed: 480, hue: 200, stars: [15, 30], segs: [
    O(600), T(400,300,360), O(300), { type:'gate', gap:300, amp:80 }, O(300),
    T(400,300,360), O(200), { type:'gate', gap:280, amp:100, len:900 }, O(300),
    I('circle',360,90), O(300), { type:'gate', gap:260, amp:110 }, O(300), T(500,280,360) ]},
  { name: 'Respiração', speed: 500, hue: 50, pinkEvery: 4, stars: [25, 45], segs: [
    O(600), I('circle',360,80,{pulse:true}), O(300), I('square',360,80,{pulse:true}),
    T(500,300,360), I('diamond',360,70,{pulse:true,gap:340}), O(300), P(), O(300),
    I('circle',280,80,{pulse:true}), I('circle',440,80,{pulse:true}), O(300), T(500,280,360) ]},
  { name: 'Serpente', speed: 460, hue: 120, pinkEvery: 4, stars: [30, 55], segs: [
    O(600), { type:'zigzag', count:4, amp:110 }, O(300), T(400,340,360),
    { type:'zigzag', count:4, amp:70, size:200, shape:'square', sp:500, gap:340 },
    T(400,340,360), O(300), P(), O(300),
    { type:'zigzag', count:6, amp:70, size:200, shape:'square', sp:480, gap:340 },
    T(500,280,360) ]},
  { name: 'Contratempo', speed: 520, hue: 330, pinkEvery: 3, stars: [30, 55], segs: [
    O(600), P(), O(400), I('circle',360,80,{pulse:true}), O(300), P(), O(300),
    T(400,320,360), I('diamond',360,70,{pulse:true,gap:340}), T(300,320,360), O(300),
    { type:'gate', gap:280, amp:90 }, O(300), P(), O(250), P(), O(300),
    I('square',300,70,{pulse:true}), I('square',420,70,{pulse:true}), O(300),
    T(500,280,360) ]},
  { name: 'Pulse Final', speed: 560, hue: 0, pinkEvery: 3, stars: [40, 70], segs: [
    O(600), T(400,300,360), I('circle',360,80,{gap:320}), T(300,300,360,300),
    O(300), P(), O(300), { type:'gate', gap:270, amp:100 }, O(300),
    { type:'zigzag', count:4, amp:110 }, O(300),
    I('circle',360,80,{pulse:true}), O(250), P(), O(300),
    { type:'zigzag', count:4, amp:70, size:200, shape:'square', sp:540, gap:340 },
    O(300), { type:'gate', gap:260, amp:110, len:900 }, O(300),
    P(), O(250), P(), O(300), T(600,260,360) ]},
];
const ALL_NAMES = LEVELS.map(l => l.name);

// ================= MOTOR: SEGMENTOS -> OBSTÁCULOS =================
function addSeg(s, x, out, pe) {
  const len = s.len || ({ island: 300, pink: 400, gate: 700 }[s.type] || 300);
  switch (s.type) {
    case 'tunnel': out.push({ k:'tunnel', x0:x, x1:x+len, gap:s.gap, cy0:s.cy0, cy1:s.cy1 }); break;
    case 'island':
      if (s.gap) { const c = s.cy ?? s.y; out.push({ k:'tunnel', x0:x, x1:x+len, gap:s.gap, cy0:c, cy1:c }); }
      out.push({ k:'island', x:x+len/2, y:s.y, size:s.size, shape:s.shape, pulse:!!s.pulse }); break;
    case 'pink': out.push({ k:'pink', x:x+len/2, w:50, every:s.every || pe || 4 }); break;
    case 'gate': out.push({ k:'gate', x0:x, x1:x+len, gap:s.gap||260, cy:s.cy||MID, amp:s.amp||120 }); break;
    case 'zigzag': {
      const n = s.count || 4, sp = s.sp || 260, len = 150 + n * sp, f = s.flip ? -1 : 1;
      if (s.gap) out.push({ k:'tunnel', x0:x, x1:x+len, gap:s.gap, cy0:MID, cy1:MID });
      for (let i = 0; i < n; i++) out.push({ k:'island', x:x+150+i*sp, y:MID+(i%2?1:-1)*f*(s.amp||110),
        size:s.size||80, shape:s.shape||'diamond', pulse:false });
      return x + len;
    }
  }
  return x + len;
}

// ================= MODO INFINITO: GERADOR =================
const PH = [
  { t:0,   sp:420, pool:['tunnel'],                                   gap:[300,340] },
  { t:15,  sp:470, pool:['tunnel','island'],                          gap:[270,320] },
  { t:30,  sp:520, pool:['tunnel','island','pink'], pe:4,             gap:[250,300] },
  { t:50,  sp:580, pool:['tunnel','island','pink','islandGap','gate'], pe:2, gap:[230,280] },
  { t:75,  sp:650, pool:['tunnel','island','pink','islandGap','gate','pulse','zigzag'], pe:2, gap:[220,260] },
  { t:110, sp:700, pool:['tunnel','island','pink','islandGap','gate','pulse','zigzag'], pe:1, gap:[210,250] },
];
const phase = t => PH.reduce((p, q) => t >= q.t ? q : p, PH[0]);

function genMore() {
  const G = g.gen, p = phase(g.t);
  while (G.x < g.dist + W * 2.5) {
    let type = p.pool.find(t => !G.seen.has(t)) || pick(p.pool);
    if (G.hard >= 2) type = 'tunnel';
    const gap = rnd(...p.gap); let s;

    if (type !== 'tunnel' && G.wall) {
      const off = Math.abs(G.cy - MID);
      const need = off / 0.75 * 1.6 + g.speed * 0.35;
      G.x = addSeg(O(Math.max(250, need)), G.x, g.obs);
    }

    switch (type) {
      case 'tunnel': { const c1 = clamp(G.cy + rnd(-180,180), BORDER+gap/2+20, H-BORDER-gap/2-20);
        s = T(rnd(400,700), gap, G.cy, c1); G.cy = c1; break; }
      case 'island':    s = I(pick(SHAPES), rnd(260,460), rnd(70,110)); break;
      case 'islandGap': s = I(pick(SHAPES), MID, rnd(60,80), { gap: gap + 90 }); break;
      case 'pulse':     s = I(pick(SHAPES), MID, 80, { pulse: true }); break;
      case 'pink':      s = P(); break;
      case 'gate':      s = { type:'gate', gap, amp:rnd(80,140) }; break;
      case 'zigzag':    s = { type:'zigzag', count:4, amp:110, sp:Math.max(260, g.speed * 0.5), flip: G.cy > MID }; break;
    }
    const fresh = !G.seen.has(type); G.seen.add(type);
    if (fresh && g.t > 1) G.x = addSeg(O(400), G.x, g.obs);
    G.x = addSeg(s, G.x, g.obs, p.pe);
    if (fresh) G.x = addSeg(O(400), G.x, g.obs);
    const easy = type === 'tunnel';
    if (!easy) { G.cy = MID; G.x = addSeg(O(rnd(100,250)), G.x, g.obs); }
    G.wall = easy;
    G.hard = easy ? 0 : G.hard + 1;
  }
  g.obs = g.obs.filter(o => (o.x1 ?? o.x + 200) > g.dist - 200);
}

// ================= ÁUDIO =================
let ac;
function initAudio() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); initMusic(); }
function tone(f0, f1, d, type = 'sine', v = .5) {
  if (!ac) return;
  const o = ac.createOscillator(), gn = ac.createGain(), t = ac.currentTime;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
  gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(gn).connect(mix || ac.destination); o.start(t); o.stop(t + d);
}
const kick  = () => tone(150, 40, .25, 'sine', .7);
const bling = () => tone(880, 1320, .12, 'triangle', .2);
const crash = () => tone(200, 30, .5, 'sawtooth', .4);
const yay   = () => { tone(523,1046,.3,'triangle',.3); setTimeout(()=>tone(784,1568,.4,'triangle',.3),150); };

// ================= MÚSICA =================
let mix, musBus, musLP, noiseBuf;
function initMusic() {
  if (mix) return;
  mix = ac.createGain(); mix.gain.value = save.mute ? 0 : 1; mix.connect(ac.destination);
  musLP = ac.createBiquadFilter(); musLP.type = 'lowpass'; musLP.frequency.value = 18000;
  musBus = ac.createGain(); musBus.gain.value = .55; musBus.connect(musLP).connect(mix);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * .2, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function note(f, t, d, type, v, cut = 4000) {
  const o = ac.createOscillator(), gn = ac.createGain(), lp = ac.createBiquadFilter();
  o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = cut;
  gn.gain.setValueAtTime(.0001, t); gn.gain.linearRampToValueAtTime(v, t + .01);
  gn.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(lp).connect(gn).connect(musBus); o.start(t); o.stop(t + d + .05);
}
function hat(t, v) {
  const s = ac.createBufferSource(), hp = ac.createBiquadFilter(), gn = ac.createGain();
  s.buffer = noiseBuf; hp.type = 'highpass'; hp.frequency.value = 7000;
  gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.001, t + .05);
  s.connect(hp).connect(gn).connect(musBus); s.start(t); s.stop(t + .06);
}
const mf = n => 440 * 2 ** ((n - 69) / 12);
const PROG = [[57,60,64],[53,57,60],[48,52,55],[55,59,62]]; // Am F C G

function music(b) {
  const lvl = g.L ? 1 + Math.floor(progress() * 3.2) : Math.min(4, 1 + Math.floor(g.t / 25));
  const ch = PROG[Math.floor(b / 4) % 4], t0 = ac.currentTime + .02, s = BEAT / 4;
  if (b % 4 === 0) ch.forEach(n => note(mf(n), t0, BEAT * 4, 'triangle', .1, 1600));
  for (let i = 0; i < 2; i++)
    note(mf(ch[0] - 24), t0 + i * BEAT / 2, BEAT / 2 * .9, 'sawtooth', .22, 600 + lvl * 150);
  if (lvl >= 2) for (let i = 0; i < 4; i++) hat(t0 + i * s, i % 2 ? .12 : .05);
  if (lvl >= 3) for (let i = 0; i < 4; i++) {
    const n = ch[[0,1,2,1][i]] + 12 + (lvl >= 4 && i === 3 ? 12 : 0);
    note(mf(n), t0 + i * s, s * .9, 'square', .05, 2500);
  }
}

// ================= ESTADO =================
let g = null, hold = false, state = 'menu';
const setPlaying = on => document.body.classList.toggle('playing', on);

function start(mode, lv = 0) {
  const L = mode === 'levels' ? LEVELS[lv] : null;
  g = { mode, lv, L, t:0, dist:0, speed:L?L.speed:420, hue:L?L.hue:185, y:MID, vy:0,
        obs:[], endX:Infinity, startX:PX, bonus:0, beat:-1, env:0, trail:[], pops:[], parts:[],
        dead:false, deadT:0, cam:0, gen:{ x:PX+800, cy:MID, hard:0, seen:new Set() } };
  if (L) { let x = PX + 200; for (const s of L.segs) x = addSeg(s, x, g.obs, L.pinkEvery); g.endX = x + 300; }
  hold = false; state = 'play'; show(null); initAudio(); setPlaying(true);
  musLP.frequency.setTargetAtTime(18000, ac.currentTime, .05);
  // PokiSDK.gameplayStart();
}

// ================= COLISÃO =================
const wallCy = (o, px) => o.k === 'gate'
  ? o.cy + o.amp * Math.sin(g.t * Math.PI / (2 * BEAT))
  : o.cy0 + (o.cy1 - o.cy0) * clamp((px - o.x0) / (o.x1 - o.x0), 0, 1);
const islandHalf = o => o.size / 2 * (o.pulse ? 1 + 0.4 * g.env : 1);
const pinkTop = o => o.lock ?? (Math.floor(g.beat / o.every) % 2 === 0);

function inShape(s, dx, dy, h, r) {
  if (s === 'circle')   return Math.hypot(dx, dy) < h + r;
  if (s === 'diamond')  return Math.abs(dx) + Math.abs(dy) < h + r * 1.41;
  if (s === 'triangle') return Math.abs(dx) < h + r && dy < h + r && dy > -h + 2 * Math.abs(dx) - r * 2.24;
  return Math.abs(dx) < h + r && Math.abs(dy) < h + r;
}

function bonus(v, txt, c) { g.bonus += v; g.pops.push({ txt, c, t:.8, y:g.y - 30 }); bling(); }
const graze = () => bonus(5, 'RASPANDO! +5', '#0ff');

function collide() {
  const px = g.dist + PX, y = g.y;
  if (y - PR < BORDER || y + PR > H - BORDER) return die();
  for (const o of g.obs) {
    if (o.k === 'tunnel' || o.k === 'gate') {
      if (px < o.x0 || px > o.x1) continue;
      const cy = wallCy(o, px), top = cy - o.gap / 2, bot = cy + o.gap / 2;
      if (y - PR < top || y + PR > bot) return die();
      if (!o.g && Math.min(y - PR - top, bot - y - PR) < 10) { o.g = 1; graze(); }
    } else if (o.k === 'island') {
      const dx = px - o.x, dy = y - o.y; if (Math.abs(dx) > 200) continue;
      const h = islandHalf(o) * 0.9;
      if (inShape(o.shape, dx, dy, h, PR)) return die();
      if (!o.g && inShape(o.shape, dx, dy, h, PR + 16)) { o.g = 1; graze(); }
    } else if (o.k === 'pink') {
      if (Math.abs(px - o.x) < o.w / 2 + PR) {
        if (o.lock === undefined) o.lock = pinkTop(o);
        if (o.lock ? y - PR < MID : y + PR > MID) return die();
      } else if (!o.p && px > o.x) { o.p = 1; bonus(10, 'NO RITMO! +10', '#ff3fa4'); }
    }
  }
}

function die() {
  g.dead = true; g.deadT = .9; g.shake = 14; crash();
  if (musLP) musLP.frequency.setTargetAtTime(350, ac.currentTime, .08);
  for (let i = 0; i < 30; i++) { const a = rnd(0, 6.28), s = rnd(100, 500);
    g.parts.push({ x:g.dist+PX, y:g.y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, t:rnd(.4,.9) }); }
  // PokiSDK.gameplayStop();
}

// ================= UPDATE =================
function update(dt) {
  if (state !== 'play') return;
  g.t += dt;
  if (g.mode === 'endless') {
    const sp = g.t > 110 ? Math.min(800, 700 + (g.t - 110)) : phase(g.t).sp;
    g.speed += (sp - g.speed) * dt * .5;
    g.hue = (185 + g.t * 1.5) % 360;
    genMore();
  }
  const b = Math.floor(g.t / BEAT);
  if (b !== g.beat) { g.beat = b; g.env = 1; g.cam = b % 4 === 0 ? 1 : .5; kick(); if (!g.dead) music(b); }
  g.env = Math.max(0, g.env - dt * 4);
  g.cam = Math.max(0, g.cam - dt * 5);


  for (const p of g.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; }
  g.parts = g.parts.filter(p => p.t > 0);
  for (const p of g.pops) { p.t -= dt; p.y -= 40 * dt; }
  g.pops = g.pops.filter(p => p.t > 0);

  if (g.dead) { if ((g.deadT -= dt) <= 0) showResult(false); return; }

  g.dist += g.speed * dt;
  const tv = (hold ? -1 : 1) * g.speed * .75;
  g.vy += (tv - g.vy) * Math.min(1, dt * 14);
  g.y += g.vy * dt;
  g.trail.push({ x: g.dist + PX, y: g.y }); if (g.trail.length > 40) g.trail.shift();

  collide();
  if (!g.dead && g.dist + PX > g.endX) { yay(); showResult(true); }
}

// ================= DESENHO =================
function shapePath(s, x, y, h) {
  ctx.beginPath();
  if (s === 'circle') ctx.arc(x, y, h, 0, 6.29);
  else if (s === 'diamond') { ctx.moveTo(x, y-h); ctx.lineTo(x+h, y); ctx.lineTo(x, y+h); ctx.lineTo(x-h, y); }
  else if (s === 'triangle') { ctx.moveTo(x, y-h); ctx.lineTo(x+h, y+h); ctx.lineTo(x-h, y+h); }
  else ctx.rect(x-h, y-h, h*2, h*2);
  ctx.closePath();
}
function poly(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0a0a18'; ctx.fillRect(0, 0, cv.width, cv.height); // limpa a tela toda
  ctx.setTransform(VIEW, 0, 0, VIEW, 0, 0);
  if (!g) return;
  const hue = g.hue, col = `hsl(${hue},100%,60%)`, fill = `hsla(${hue},100%,50%,.22)`;
  const sh = g.shake; g.shake *= .9;
  const z = 1 + g.cam * 0.025;                                   // zoom no beat
  ctx.translate(PX, MID); ctx.scale(z, z); ctx.translate(-PX, -MID); // centrado no jogador
  ctx.translate((Math.random() - .5) * sh, (Math.random() - .5) * sh);

  const sx = x => x - g.dist;

  ctx.strokeStyle = `hsla(${hue},100%,60%,${.06 + g.env * .08})`; ctx.lineWidth = 1;
  for (let x = -(g.dist * .5 % 80); x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.shadowColor = col; ctx.shadowBlur = 12 + g.env * 20;
  ctx.fillStyle = col; ctx.fillRect(0, 0, W, BORDER); ctx.fillRect(0, H - BORDER, W, BORDER);

  for (const o of g.obs) {
    if (o.k === 'tunnel' || o.k === 'gate') {
      const a = sx(o.x0), b = sx(o.x1); if (b < 0 || a > W) continue;
      const c0 = o.k === 'gate' ? wallCy(o) : o.cy0, c1 = o.k === 'gate' ? c0 : o.cy1, h = o.gap / 2;
      const c = o.k === 'gate' ? `hsl(${(hue + 60) % 360},100%,60%)` : col;
      ctx.fillStyle = fill; ctx.strokeStyle = c; ctx.lineWidth = 3;
      poly([[a,0],[b,0],[b,c1-h],[a,c0-h]]); ctx.fill(); ctx.stroke();
      poly([[a,H],[b,H],[b,c1+h],[a,c0+h]]); ctx.fill(); ctx.stroke();
    } else if (o.k === 'island') {
      const x = sx(o.x); if (x < -150 || x > W + 150) continue;
      const c = o.pulse ? '#ffd23f' : col;
      ctx.fillStyle = o.pulse ? 'rgba(255,210,63,.25)' : fill; ctx.strokeStyle = c; ctx.lineWidth = 3;
      shapePath(o.shape, x, o.y, islandHalf(o)); ctx.fill(); ctx.stroke();
    } else if (o.k === 'pink') {
      const x = sx(o.x) - o.w / 2; if (x < -100 || x > W + 100) continue;
      const top = pinkTop(o), warn = (g.beat + 1) % o.every === 0;
      ctx.shadowColor = '#ff3fa4'; ctx.fillStyle = '#ff3fa4';
      top ? ctx.fillRect(x, BORDER, o.w, MID - BORDER) : ctx.fillRect(x, MID, o.w, H - BORDER - MID);
      ctx.strokeStyle = `rgba(255,63,164,${warn && g.env > .5 ? .9 : .3})`; ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      top ? ctx.strokeRect(x, MID, o.w, H - BORDER - MID) : ctx.strokeRect(x, BORDER, o.w, MID - BORDER);
      ctx.setLineDash([]); ctx.shadowColor = col;
    }
  }

  if (isFinite(g.endX)) { const x = sx(g.endX);
    if (x < W + 40) for (let y = BORDER, i = 0; y < H - BORDER; y += 20, i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#222'; ctx.fillRect(x, y, 20, 20);
      ctx.fillStyle = i % 2 ? '#222' : '#fff'; ctx.fillRect(x + 20, y, 20, 20); } }

  if (!g.dead) {
    ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.globalAlpha = .5; ctx.beginPath();
    g.trail.forEach((p, i) => i ? ctx.lineTo(sx(p.x), p.y) : ctx.moveTo(sx(p.x), p.y)); ctx.stroke();
    ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.shadowColor = '#fff';
    ctx.beginPath(); ctx.arc(PX, g.y, PR * (1 + g.env * .25), 0, 6.29); ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  for (const p of g.parts) { ctx.globalAlpha = p.t; ctx.fillRect(sx(p.x) - 3, p.y - 3, 6, 6); }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;

  ctx.setTransform(VIEW, 0, 0, VIEW, 0, 0);                      // HUD sem zoom/tremor
  if (g.cam > 0 && !g.dead) {                                    // flash no beat
    ctx.fillStyle = `hsla(${hue},100%,70%,${g.cam * 0.08})`; ctx.fillRect(0, 0, W, H);
  }
  ctx.font = 'bold 40px system-ui'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
  ctx.fillText(score(), 40, 70);

  ctx.textAlign = 'center'; ctx.font = 'bold 22px system-ui';
  if (g.L) {
    ctx.fillText(`NÍVEL ${g.lv + 1} – ${g.L.name.toUpperCase()}`, W / 2, 55);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(W / 2 - 200, 70, 400, 8);
    ctx.fillStyle = col; ctx.fillRect(W / 2 - 200, 70, 400 * progress(), 8);
  } else ctx.fillText(`INFINITO · RECORDE ${save.best}`, W / 2, 55);
  for (const p of g.pops) { ctx.globalAlpha = Math.min(1, p.t * 2); ctx.fillStyle = p.c; ctx.fillText(p.txt, PX + 90, p.y); }
  ctx.globalAlpha = 1;
}
const score = () => Math.floor(g.dist / 100) + g.bonus;
const progress = () => clamp((g.dist + PX - g.startX) / (g.endX - g.startX), 0, 1);

// ================= TELAS =================
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }

function showResult(won) {
  state = 'end'; setPlaying(false); let title, info, stars = '';
  $('bNext').style.display = 'none';
  if (g.mode === 'endless') {
    const s = score(); if (s > save.best) save.best = s;
    title = 'FIM!'; info = `Pontos: ${s} · Recorde: ${save.best}`;
  } else if (won) {
    const [s2, s3] = g.L.stars, st = g.bonus >= s3 ? 3 : g.bonus >= s2 ? 2 : 1;
    save.stars[g.lv] = Math.max(save.stars[g.lv] || 0, st);
    save.unlocked = Math.min(LEVELS.length, Math.max(save.unlocked, g.lv + 2));
    title = 'NÍVEL COMPLETO!'; stars = '★'.repeat(st) + '☆'.repeat(3 - st); info = `Bônus: ${g.bonus}`;
    if (g.lv + 1 < LEVELS.length) $('bNext').style.display = '';
  } else { title = 'VOCÊ BATEU!'; info = `Progresso: ${Math.floor(progress() * 100)}%`; }
  store();
  $('rTitle').textContent = title; $('rStars').textContent = stars; $('rInfo').textContent = info;
  show('result');
  // PokiSDK.commercialBreak() antes de reiniciar
}

function renderGrid() {
  const gr = $('grid'); gr.innerHTML = '';
  ALL_NAMES.forEach((n, i) => {
    const ok = i < save.unlocked, st = save.stars[i] || 0;
    const b = document.createElement('button');
    b.className = 'lv' + (ok ? '' : ' lock');
    b.innerHTML = `<b>${i + 1}</b>${n}<span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>`;
    b.onclick = () => start('levels', i); gr.appendChild(b);
  });
}
const updBest = () => $('best').textContent = save.best ? `Recorde infinito: ${save.best}` : '';

$('bLevels').onclick = () => { renderGrid(); show('levels'); };
$('bEndless').onclick = () => start('endless');
$('bBack').onclick = () => show('menu');
$('bRetry').onclick = () => start(g.mode, g.lv);
$('bNext').onclick = () => start('levels', g.lv + 1);
$('bMenu').onclick = () => { g = null; state = 'menu'; setPlaying(false); updBest(); show('menu'); };

// ================= TELA / FULLSCREEN =================
const isMobile = matchMedia('(pointer:coarse)').matches;
const fsEl = document.documentElement;
const isFS = () => document.fullscreenElement || document.webkitFullscreenElement;

function toggleFS() {
  if (isFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else {
    const req = fsEl.requestFullscreen || fsEl.webkitRequestFullscreen;
    const p = req && req.call(fsEl);
    if (p && p.then) p.then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  }
}
$('fsBtn').addEventListener('pointerdown', e => e.stopPropagation());
$('fsBtn').onclick = e => { e.stopPropagation(); e.currentTarget.blur(); toggleFS(); };
addEventListener('keydown', e => { if (e.code === 'KeyF') toggleFS(); });
document.addEventListener('fullscreenchange', () => setTimeout(resize, 100));

if (isMobile) addEventListener('pointerdown', e => { if (!isFS() && e.target.id !== 'fsBtn') toggleFS(); }, { once:true });

addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (!ac) return; document.hidden ? ac.suspend() : ac.resume();
});

// ================= INPUT =================
const KEYS = ['Space', 'ArrowUp', 'KeyW'];
cv.addEventListener('pointerdown', e => { if (state === 'play') { hold = true; e.preventDefault(); } });
addEventListener('pointerup', () => hold = false);
addEventListener('pointercancel', () => hold = false);
addEventListener('keydown', e => { if (KEYS.includes(e.code)) { hold = true; e.preventDefault(); } });
addEventListener('keyup', e => { if (KEYS.includes(e.code)) hold = false; });
addEventListener('keydown', e => { if (e.code === 'KeyM' && mix) {
  save.mute = !save.mute; store(); mix.gain.setTargetAtTime(save.mute ? 0 : 1, ac.currentTime, .05); } });

// ================= RESIZE + LOOP =================
function resize() {
  const vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  W = Math.max(960, Math.ceil(vw / (vh / H)));
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  VIEW = (vw / W) * dpr;
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));
resize(); updBest();

let last = performance.now();
(function loop(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  update(dt); draw(); requestAnimationFrame(loop);
})(last);
