const openBtn = document.getElementById("openBtn");
const replayBtn = document.getElementById("replayBtn");
const gift = document.getElementById("gift");
const reveal = document.getElementById("reveal");
const hint = document.getElementById("hint");

const lid = gift.querySelector(".lid");
const box = gift.querySelector(".box");
const sparkles = document.getElementById("sparkles");

let opened = false;

function makeSparkles(count = 36) {
  sparkles.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.style.position = "absolute";
    s.style.width = "6px";
    s.style.height = "6px";
    s.style.borderRadius = "999px";
    s.style.background = "rgba(255,255,255,.9)";
    s.style.left = "0px";
    s.style.top = "0px";
    s.style.opacity = "0";
    sparkles.appendChild(s);
  }
}

function openAnimation() {
  makeSparkles();

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to(gift, { y: -4, duration: 0.18 })
    .to(gift, { y: 0, duration: 0.18 });

  tl.to(lid, { rotation: -22, x: -22, y: -14, duration: 0.5 }, "<")
    .to(box, { y: 2, duration: 0.35 }, "<");

  const dots = [...sparkles.children];
  dots.forEach((d, i) => {
    const angle = (Math.PI * 2 * i) / dots.length;
    const r = 90 + Math.random() * 50;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r - 10;

    tl.to(
      d,
      { opacity: 1, duration: 0.05 },
      "-=0.30"
    ).to(
      d,
      { x, y, opacity: 0, scale: 0.6, duration: 0.75 },
      "<"
    );
  });

  tl.add(() => {
    reveal.style.display = "block";
    reveal.setAttribute("aria-hidden", "false");
    gsap.fromTo(reveal, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45 });
  });

  return tl;
}

function reset() {
  opened = false;
  reveal.style.display = "none";
  reveal.setAttribute("aria-hidden", "true");
  hint.textContent = "Tip: bấm thêm lần nữa để “bật nắp” mạnh hơn 😄";

  gsap.set(lid, { rotation: 0, x: 0, y: 0 });
  gsap.set(box, { y: 0 });
  gsap.set(gift, { y: 0 });
  sparkles.innerHTML = "";
}

openBtn.addEventListener("click", () => {
  if (!opened) {
    opened = true;
    hint.textContent = "Chúc mừng năm mới 2026 🎆 (kéo xuống xem lời chúc)";
    openAnimation();
  } else {
    // bấm lần 2: “lật nắp” mạnh hơn cho vui
    gsap.to(lid, { rotation: -38, x: -34, y: -22, duration: 0.35, ease: "back.out(1.6)" });
    gsap.fromTo(gift, { rotation: -1 }, { rotation: 1, yoyo: true, repeat: 3, duration: 0.08 });
  }
});

replayBtn.addEventListener("click", () => {
  reset();
  openAnimation();
});

// tải trang: chuẩn bị trạng thái
reset();
