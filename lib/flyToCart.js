"use client";

// Animates a clone of the given image flying from its current position to the
// navbar cart icon (id="nav-cart-icon") along an arced path, then bumps the
// cart icon on arrival.
let flyCounter = 0;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Interpolates a value between anchor points using smoothstep easing within
// each segment — avoids the velocity "reset" that happens at every keyframe
// boundary when the browser re-applies the animation's easing per segment.
function interpAnchors(anchors, key, t) {
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (t >= a.t && t <= b.t) {
      const localT = smoothstep(a.t, b.t, t);
      return a[key] + (b[key] - a[key]) * localT;
    }
  }
  return anchors[anchors.length - 1][key];
}

export function flyToCart(imgEl, imgSrc) {
  if (typeof window === "undefined" || !imgEl) return;

  const cartIcon = document.getElementById("nav-cart-icon");
  if (!cartIcon) return;

  const startRect = imgEl.getBoundingClientRect();
  if (startRect.width === 0 || startRect.height === 0) return;

  const src = imgSrc || imgEl.currentSrc || imgEl.src;
  if (!src) return;

  const endRect = cartIcon.getBoundingClientRect();

  // The navbar isn't fixed/sticky, so once the page is scrolled the cart
  // icon can sit far above the visible viewport (even off-screen). Clamp the
  // landing point to stay inside the viewport so the image always lands
  // somewhere visible instead of flying out past the top of the page.
  const pad = 20;
  const startCenterX = startRect.left + startRect.width / 2;
  const startCenterY = startRect.top + startRect.height / 2;
  const endCenterX = Math.min(
    Math.max(endRect.left + endRect.width / 2, pad),
    window.innerWidth - pad,
  );
  const endCenterY = Math.min(
    Math.max(endRect.top + endRect.height / 2, pad),
    window.innerHeight - pad,
  );
  const dx = endCenterX - startCenterX;
  const dy = endCenterY - startCenterY;
  const dist = Math.hypot(dx, dy);
  // Lift the mid-flight path upward like a thrown object, not a straight line.
  const arcHeight = Math.min(220, Math.max(70, dist * 0.35));

  // Pop slightly bigger right after launch so the image reads clearly, then
  // shrink gradually over the rest of the flight instead of all at once.
  const anchors = [
    { t: 0, scale: 1, opacity: 1 },
    { t: 0.12, scale: 1.12, opacity: 1 },
    { t: 0.42, scale: 0.7, opacity: 1 },
    { t: 0.72, scale: 0.32, opacity: 0.9 },
    { t: 1, scale: 0.08, opacity: 0.28 },
  ];

  // Sample many fine-grained keyframes with the easing already baked into the
  // sampled values, then play the animation with a *linear* timing function.
  // (Using a CSS easing function on top of a handful of keyframes makes the
  // browser re-ease every segment, which reads as the image "pausing" at
  // each keyframe — this is what caused the stutter.)
  const SAMPLES = 48;
  const frames = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x = dx * t;
    const arc = -4 * arcHeight * t * (1 - t);
    const y = dy * t + arc;
    const scale = interpAnchors(anchors, "scale", t);
    const opacity = interpAnchors(anchors, "opacity", t);
    const pct = (t * 100).toFixed(2);
    frames.push(
      `${pct}% { transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)}); opacity: ${opacity.toFixed(3)}; }`,
    );
  }

  const animName = `fly-to-cart-${Date.now()}-${flyCounter++}`;
  const styleTag = document.createElement("style");
  styleTag.textContent = `@keyframes ${animName} {\n${frames.join("\n")}\n}`;
  document.head.appendChild(styleTag);

  const flyer = document.createElement("img");
  flyer.src = src;
  Object.assign(flyer.style, {
    position: "fixed",
    top: `${startRect.top}px`,
    left: `${startRect.left}px`,
    width: `${startRect.width}px`,
    height: `${startRect.height}px`,
    objectFit: "cover",
    borderRadius: "12px",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 10px 28px rgba(0,0,0,0.3)",
    transformOrigin: "center center",
    animation: `${animName} 0.9s linear forwards`,
    willChange: "transform, opacity",
  });
  document.body.appendChild(flyer);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    flyer.remove();
    styleTag.remove();
    cartIcon.classList.remove("animate-heartbeat");
    // reflow so the animation can replay if it's already mid-run
    void cartIcon.offsetWidth;
    cartIcon.classList.add("animate-heartbeat");
    setTimeout(() => cartIcon.classList.remove("animate-heartbeat"), 650);
  };
  flyer.addEventListener("animationend", cleanup, { once: true });
  setTimeout(cleanup, 1050);
}
