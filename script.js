// ===== DOM =====
const openBtn = document.getElementById("openBtn");
const replayBtn = document.getElementById("replayBtn");
const gift = document.getElementById("gift");
const reveal = document.getElementById("reveal");
const hint = document.getElementById("hint");
const typedEl = document.getElementById("typed");

const audioBtn = document.getElementById("audioBtn");
const fireBtn = document.getElementById("fireBtn");
const bgm = document.getElementById("bgm");

const lid = gift.querySelector(".lid");
const box = gift.querySelector(".box");
const sparkles = document.getElementById("sparkles");

let opened = false;

// ===== 1) TYPEWRITER =====
let typingTimer = null;
function typewriter(el, { speed = 22, startDelay = 150 } = {}) {
  if (!el) return;
  const text = el.getAttribute("data-text") || "";
  el.textContent = "";
  el.classList.add("typing");
  if (typingTimer) clearTimeout(typingTimer);

  let i = 0;
  const tick = () => {
    // gõ theo “nhịp người”: nhanh vừa, có nhịp nghỉ nhẹ sau dấu câu
    const ch = text[i];
    el.textContent += ch ?? "";
    i++;

    if (i >= text.length) {
      el.classList.remove("typing");
      return;
    }

    let next = speed;
    if (ch === "," || ch === "，") next += 120;
    if (ch === "." || ch === "。" || ch === "!" || ch === "?" ) next += 220;
    if (ch === "…" ) next += 260;

    typingTimer = setTimeout(tick, next);
  };

  typingTimer = setTimeout(tick, startDelay);
}

// ===== 2) AUDIO TOGGLE =====
let audioOn = false;

async function setAudio(on) {
  audioOn = on;
  audioBtn.setAttribute("aria-pressed", String(on));
  audioBtn.textContent = on ? "🔊 Nhạc" : "🔇 Nhạc";

  if (on) {
    try {
      // play có thể bị chặn nếu chưa có user gesture
      await bgm.play();
    } catch (e) {
      // Nếu bị chặn, chuyển về off, chờ user bấm lại
      audioOn = false;
      audioBtn.setAttribute("aria-pressed", "false");
      audioBtn.textContent = "🔇 Nhạc";
    }
  } else {
    bgm.pause();
  }
}

audioBtn.addEventListener("click", () => setAudio(!audioOn));

// ===== 3) FIREWORKS CANVAS =====
const canvas = document.getElementById("fw");
const ctx = canvas.getContext("2d");

let fireOn = true;
let raf = null;
let W = 0, H = 0;

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);

const fireworks = [];
const particles = [];

function rand(min, max) { return min + Math.random() * (max - min); }

function launch() {
  // bắn từ dưới lên
  const x = rand(W * 0.15, W * 0.85);
  const y = H + 10;
  const targetY = rand(H * 0.18, H * 0.45);
  const vx = rand(-1.2, 1.2);
  const vy = rand(-10.5, -8.5);
  fireworks.push({ x, y, vx, vy, targetY, life: 0 });
}

function explode(x, y) {
  const count = Math.floor(rand(40, 70)); // nhẹ vừa đủ đẹp
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const sp = rand(2.2, 5.4);
    particles.push({
      x, y,
      vx: Math.cos(a) * sp + rand(-0.6, 0.6),
      vy: Math.sin(a) * sp + rand(-0.6, 0.6),
      g: 0.08,
      drag: 0.985,
      life: 0,
      ttl: rand(40, 80),
      // dùng trắng dịu + alpha để không “chiếm sóng” chữ
      alpha: 1
    });
  }
}

function stepFireworks() {
  // fade nền để tạo vệt
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, W, H);

  // rockets
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const f = fireworks[i];
    f.life++;

    f.x += f.vx;
    f.y += f.vy;
    f.vy += 0.12; // gravity nhẹ

    // vệt rocket
    ctx.beginPath();
    ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();

    if (f.y <= f.targetY || f.life > 90) {
      explode(f.x, f.y);
      fireworks.splice(i, 1);
    }
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life++;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;

    p.alpha = Math.max(0, 1 - p.life / p.ttl);

    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.75 * p.alpha})`;
    ctx.fill();

    if (p.life >= p.ttl) particles.splice(i, 1);
  }
}

let launchTimer = 0;
function loop() {
  if (!fireOn) return;

  stepFireworks();

  // thỉnh thoảng bắn 1 quả
  launchTimer++;
  if (launchTimer % 22 === 0 && fireworks.length < 4) {
    if (Math.random() < 0.9) launch();
  }

  raf = requestAnimationFrame(loop);
}

function startFireworks() {
  fireOn = true;
  fireBtn.setAttribute("aria-pressed", "true");
  fireBtn.textContent = "🎆 Pháo hoa";
  if (!raf) raf = requestAnimationFrame(loop);
}

function stopFireworks() {
  fireOn = false;
  fireBtn.setAttribute("aria-pressed", "false");
  fireBtn.textContent = "🎇 Pháo hoa";
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  // clear nhẹ để không “đen” đột ngột
  ctx.clearRect(0, 0, W, H);
}

fireBtn.addEventListener("click", () => {
  if (fireOn) stopFireworks();
  else startFireworks();
});

// ===== 4) OPEN GIFT ANIMATION (fallback + optional GSAP) =====
function initConfetti(count = 12) {
  if (sparkles.children.length) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("i");
    p.style.position = "absolute";
    p.style.width = "7px";
    p.style.height = "7px";
    p.style.borderRadius = "999px";
    p.style.left = "0px";
    p.style.top = "0px";
    p.style.opacity = "0";
    p.style.background = "rgba(255,255,255,.85)";
    sparkles.appendChild(p);
  }
}

function showReveal() {
  reveal.style.display = "block";
  reveal.setAttribute("aria-hidden", "false");
  reveal.style.opacity = "1";
  reveal.style.transform = "translateY(0)";

  // start typewriter
  typewriter(typedEl, { speed: 22, startDelay: 180 });
}

function hideReveal() {
  reveal.style.display = "none";
  reveal.setAttribute("aria-hidden", "true");
}

function openFallback() {
  initConfetti();

  lid.animate(
    [
      { transform: "translateX(-50%) rotate(0deg) translate(0,0)" },
      { transform: "translateX(-50%) rotate(-22deg) translate(-22px,-14px)" }
    ],
    { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
  );

  box.animate(
    [{ transform: "translateX(-50%) translateY(0px)" }, { transform: "translateX(-50%) translateY(2px)" }],
    { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
  );

  [...sparkles.children].forEach((d, i) => {
    const angle = (Math.PI * 2 * i) / sparkles.children.length;
    const r = 75 + Math.random() * 30;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r - 10;

    d.animate(
      [
        { opacity: 0, transform: "translate(0px,0px) scale(1)" },
        { opacity: 1, transform: "translate(0px,0px) scale(1)" },
        { opacity: 0, transform: `translate(${x}px,${y}px) scale(.6)` }
      ],
      { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards", delay: 40 + i * 10 }
    );
  });

  setTimeout(showReveal, 320);
}

// Optional: GSAP load-on-click (chỉ để replay mượt)
let gsapReady = false;
function loadGSAP() {
  if (window.gsap) { gsapReady = true; return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    s.async = true;
    s.onload = () => { gsapReady = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function openWithGSAP() {
  initConfetti();
  const tl = window.gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to(gift, { y: -3, duration: 0.12 })
    .to(gift, { y: 0, duration: 0.12 });

  tl.to(lid, { rotation: -22, x: -22, y: -14, duration: 0.42 }, "<")
    .to(box, { y: 2, duration: 0.22 }, "<");

  const dots = [...sparkles.children];
  dots.forEach((d, i) => {
    const angle = (Math.PI * 2 * i) / dots.length;
    const r = 80 + Math.random() * 30;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r - 10;

    tl.fromTo(
      d,
      { opacity: 0, x: 0, y: 0, scale: 1 },
      { opacity: 0, x, y, scale: 0.6, duration: 0.55, delay: i * 0.01 },
      "-=0.15"
    );
  });

  tl.add(showReveal, "-=0.35");
  return tl;
}

function reset() {
  opened = false;
  hideReveal();
  hint.textContent = "Tip: bấm thêm lần nữa để “bật nắp” mạnh hơn 😄";
  sparkles.innerHTML = "";
  if (typedEl) typedEl.textContent = "";

  // reset transforms
  lid.style.transform = "";
  box.style.transform = "";

  if (window.gsap) {
    window.gsap.set(lid, { rotation: 0, x: 0, y: 0 });
    window.gsap.set(box, { y: 0 });
    window.gsap.set(gift, { y: 0, rotation: 0 });
  }
}

// ===== 5) EVENTS =====
openBtn.addEventListener("click", async () => {
  if (!opened) {
    opened = true;
    hint.textContent = "Nếu load mãi chưa xong thì đợi khoảng 20s nhá (kéo xuống phía dưới)";

    // Pháo hoa: bật (nếu đang tắt thì bật lại) và bắn liền cho “đã”
    if (!fireOn) startFireworks();
    launch(); launch();

    // Nhạc: bật nếu đang tắt (vì đây là user gesture)
    if (!audioOn) await setAudio(true);

    // Mở quà nhanh bằng fallback trước
    openFallback();

    // Load GSAP “ngầm” cho replay
    try {
      await Promise.race([
        loadGSAP(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("GSAP timeout")), 1200))
      ]);
    } catch (e) {}

  } else {
    // bấm lần 2: lật nắp mạnh hơn
    if (window.gsap) {
      window.gsap.to(lid, { rotation: -38, x: -34, y: -22, duration: 0.3, ease: "back.out(1.6)" });
      window.gsap.fromTo(gift, { rotation: -1 }, { rotation: 1, yoyo: true, repeat: 3, duration: 0.08 });
    } else {
      lid.animate(
        [
          { transform: "translateX(-50%) rotate(-22deg) translate(-22px,-14px)" },
          { transform: "translateX(-50%) rotate(-38deg) translate(-34px,-22px)" }
        ],
        { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
      );
    }
    // bắn thêm 1 quả cho vui
    if (fireOn) launch();
  }
});

replayBtn.addEventListener("click", async () => {
  reset();

  if (fireOn) { launch(); launch(); }

  // replay: GSAP nếu có, không thì fallback
  if (window.gsap || gsapReady) {
    try {
      await loadGSAP();
      openWithGSAP();
      hint.textContent = "Replay 🎆";
      opened = true;
      return;
    } catch (e) {}
  }
  openFallback();
  hint.textContent = "Replay 🎆";
  opened = true;
});

// ===== INIT =====
resizeCanvas();
startFireworks();     // bật pháo hoa nền từ đầu (im lặng, không bắt buộc)
reset();
setAudio(false);  
