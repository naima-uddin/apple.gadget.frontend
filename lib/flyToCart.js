"use client";

// Animates a clone of the given image flying from its current position to the
// navbar cart icon (id="nav-cart-icon"), then bumps the cart icon on arrival.
export function flyToCart(imgEl, imgSrc) {
  if (typeof window === "undefined" || !imgEl) return;

  const cartIcon = document.getElementById("nav-cart-icon");
  if (!cartIcon) return;

  const startRect = imgEl.getBoundingClientRect();
  if (startRect.width === 0 || startRect.height === 0) return;

  const src = imgSrc || imgEl.currentSrc || imgEl.src;
  if (!src) return;

  const endRect = cartIcon.getBoundingClientRect();

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
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    transition: "transform 0.75s cubic-bezier(0.22,1,0.36,1), opacity 0.75s ease-in",
    willChange: "transform, opacity",
  });
  document.body.appendChild(flyer);

  const dx =
    endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
  const dy =
    endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.transform = `translate(${dx}px, ${dy}px) scale(0.08)`;
      flyer.style.opacity = "0.35";
    });
  });

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    flyer.remove();
    cartIcon.classList.remove("animate-heartbeat");
    // reflow so the animation can replay if it's already mid-run
    void cartIcon.offsetWidth;
    cartIcon.classList.add("animate-heartbeat");
    setTimeout(() => cartIcon.classList.remove("animate-heartbeat"), 650);
  };
  flyer.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, 900);
}
