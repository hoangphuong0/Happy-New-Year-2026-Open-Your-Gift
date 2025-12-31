const openBtn = document.getElementById("openBtn");
const replayBtn = document.getElementById("replayBtn");
const gift = document.getElementById("gift");
const reveal = document.getElementById("reveal");
const hint = document.getElementById("hint");

const lid = gift.querySelector(".lid");
const box = gift.querySelector(".box");
const sparkles = document.getElementById("sparkles");

let opened = false;
let gsapReady = false;

// 1) Confetti nhẹ: tạo ít phần tử, tạo 1 lần, tái sử dụng
function initConfetti(count = 14) {
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
    // không set màu cụ thể để tránh “đè vibe”, dùng trắng dịu
    p.style.background = "rgba(255,255,255,.85)";
    sparkles.appendChild(p);
  }
}

function showReveal() {
  reveal.style.display = "block";
  reveal.setAttribute("aria-hidden", "false");
  reveal.style.opacity = "1";
  reveal.style.transform = "translateY(0)";
}

function hideReveal() {
  reveal.style.display = "none";
  reveal.setAttribute("aria-hidden", "true");
}

// 2) Fallback animation không cần GSAP (CSS-ish bằng Web Animations)
function openFallback() {
  initConfetti();

  // “bật nắp” nhanh
  lid.animate(
    [
      { transform: "translateX(-50%) rotate(0deg) translate(0,0)" },
      { transform: "translateX(-50%) rotate(-22deg) translate(-22px,-14px)" }
    ],
    { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
  );

  box.animate([{ transform: "translateX(-50%) translateY(0px)" }, { transform: "translateX(-50%) translateY(2px)" }],
    { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
  );

  // confetti tỏa vòng tròn nhẹ
  [...sparkles.children].forEach((d, i) => {
    const angle = (Math.PI * 2 * i) / sparkles.children.length;
    const r = 80 + Math.random() * 35;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r - 10;

    d.animate(
      [
        { opacity: 0, transform: "translate(0px,0px) scale(1)" },
        { opacity: 1, transform: "translate(0px,0px) scale(1)" },
        { opacity: 0, transform: `translate(${x}px,${y}px) scale(.6)` }
      ],
      { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards", delay: 40 + i * 8 }
    );
  });

  // reveal sau 350ms để cảm giác “mở ra là thấy”
  setTimeout(() => {
    showReveal();
  }, 350);
}

// 3) Load GSAP chỉ khi cần
function loadGSAP() {
  if (window.gsap) {
    gsapReady = true;
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    // CDN cloudflare thường ổn hơn
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    s.async = true;
    s.onload = () => {
      gsapReady = true;
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// 4) Animation GSAP tối ưu: ít tween, ít loop, reveal nhanh
function openWithGSAP() {
  initConfetti();

  const tl = window.gsap.timeline({ defaults: { ease: "power3.out" } });

  // bounce nhẹ (siêu ngắn)
  tl.to(gift, { y: -3, duration: 0.12 })
    .to(gift, { y: 0, duration: 0.12 });

  // mở nắp
  tl.to(lid, { rotation: -22, x: -22, y: -14, duration: 0.42 }, "<")
    .to(box, { y: 2, duration: 0.22 }, "<");

  // confetti: dùng ít phần tử và animate song song (không chain hàng loạt)
  const dots = [...sparkles.children];
  dots.forEach((d, i) => {
    const angle = (Math.PI * 2 * i) / dots.length;
    const r = 85 + Math.random() * 35;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r - 10;

    tl.fromTo(
      d,
      { opacity: 0, x: 0, y: 0, scale: 1 },
      { opacity: 0, x, y, scale: 0.6, duration: 0.55, delay: i * 0.01 },
      "-=0.15"
    );
  });

  // reveal nhanh (đừng đợi confetti xong)
  tl.add(() => showReveal(), "-=0.35");

  return tl;
}

function reset() {
  opened = false;
  hideReveal();
  hint.textContent = "Tip: bấm thêm lần nữa để “bật nắp” mạnh hơn 😄";
  sparkles.innerHTML = "";

  // reset transform “tĩnh”
  lid.style.transform = "";
  box.style.transform = "";

  // reset gsap nếu có
  if (window.gsap) {
    window.gsap.set(lid, { rotation: 0, x: 0, y: 0 });
    window.gsap.set(box, { y: 0 });
    window.gsap.set(gift, { y: 0, rotation: 0 });
  }
}

openBtn.addEventListener("click", async () => {
  if (!opened) {
    opened = true;
    hint.textContent = "Nếu load mãi chưa ra thì đợi khoảng 20s nhá (kéo xuống phía dưới )";

    // ưu tiên mở nhanh: chạy fallback ngay lập tức
    openFallback();

    // rồi mới cố load GSAP để lần bấm sau / replay mượt hơn
    try {
      await Promise.race([
        loadGSAP(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("GSAP timeout")), 1200))
      ]);
    } catch (e) {
      // không sao, fallback đã chạy
    }

  } else {
    // bấm lần 2: nếu GSAP có thì “lật nắp” mạnh hơn, không thì dùng Web Animations
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
  }
});

replayBtn.addEventListener("click", async () => {
  reset();

  // replay: nếu đã có GSAP thì dùng GSAP, không thì fallback
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

// load trang: chuẩn bị trạng thái
reset();
