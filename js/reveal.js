const targets = document.querySelectorAll(".section-title, .card, .hero-strip li, .feature-item, .overview-media");
const motionAllowed = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

if (motionAllowed && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8% 0px" });

  for (const target of targets) {
    const siblings = [...target.parentElement.children].filter((child) => child.tagName === target.tagName && !child.classList.contains("section-title"));
    const position = Math.max(siblings.indexOf(target), 0);
    target.style.setProperty("--reveal-delay", `${position * 0.06}s`);
    target.classList.add("reveal");
    observer.observe(target);
  }
}
