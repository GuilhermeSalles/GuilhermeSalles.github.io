// Advanced ScrollReveal Configuration
const sr = ScrollReveal({
  origin: "bottom",
  distance: "60px",
  duration: 2000,
  delay: 200,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  reset: false,
  viewFactor: 0.15,
  afterReveal: (el) => {
    el.classList.add("sr-finished");
    // Trigger counter if the revealed element is a counter-card or contains a count class
    const counter = el.querySelector(".count");
    if (counter) {
      startCounter(counter);
    }
  },
});

// Reveal Targets (hero title now uses its own word-by-word animation)
sr.reveal(".reveal", { interval: 100 });
sr.reveal(".status-pill", { delay: 300 });
sr.reveal(".hero-subtitle", { delay: 700 });
sr.reveal(".hero-actions", { delay: 900 });
sr.reveal(".counter-card", { interval: 200, delay: 1100, scale: 0.9 });
sr.reveal(".section-label, .section-title", { interval: 100 });
sr.reveal(".stack-grid", { delay: 300 });
sr.reveal(".stack-item", { interval: 80, scale: 0.8 });
sr.reveal(".timeline-item", { interval: 200, origin: "left" });
sr.reveal(".project-card", { interval: 150, scale: 0.9 });

// Fast Rolling Number Animation Logic
const startCounter = (counter) => {
  if (counter.classList.contains("counted")) return; // Prevent double trigger
  counter.classList.add("counted");

  const target = +counter.getAttribute("data-target");
  const duration = 1000; // 1 second (Faster)
  const start = 0;
  let startTime = null;

  const easeOutQuad = (t) => t * (2 - t);

  const animate = (currentTime) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuad(progress);

    const currentCount = Math.round(start + (target - start) * easedProgress);
    counter.innerText = currentCount;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      counter.innerText = target;
    }
  };

  requestAnimationFrame(animate);
};

// Language Switch Logic
const initLanguage = () => {
  const langToggle = document.getElementById("lang-toggle");
  const body = document.body;

  const setLanguage = (lang) => {
    body.setAttribute("data-lang", lang);
    document.querySelectorAll("[data-pt]").forEach((el) => {
      const translation = el.getAttribute(`data-${lang}`);
      if (translation) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = translation;
        } else {
          el.innerText = translation;
        }
      }
    });

    localStorage.setItem("preferred-lang", lang);
    document.dispatchEvent(new CustomEvent("langChange", { detail: lang }));

    if (lang === "en") {
      langToggle.classList.add("active");
    } else {
      langToggle.classList.remove("active");
    }
  };

  langToggle.addEventListener("click", () => {
    const currentLang = body.getAttribute("data-lang");
    const newLang = currentLang === "pt" ? "en" : "pt";
    setLanguage(newLang);
  });

  const savedLang = localStorage.getItem("preferred-lang") || "pt";
  setLanguage(savedLang);
};

// Scroll Spy Logic
const initScrollSpy = () => {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  const onScroll = () => {
    const scrollPos = window.scrollY + 120; // Header offset

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute("id");

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          }
        });
      }
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // Run once on init
};

// Mouse Spotlight Tracking
const initSpotlight = () => {
  if (window.matchMedia("(hover: none)").matches) return;
  const spotlight = document.querySelector(".spotlight");
  window.addEventListener(
    "mousemove",
    (e) => {
      spotlight.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
    },
    { passive: true },
  );
};

// Scroll Progress Bar
const initScrollProgress = () => {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = docHeight > 0 ? (scrollTop / docHeight) * 100 + "%" : "0%";
  }, { passive: true });
};

// Back to Top
const initBackToTop = () => {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

// ============================================================
// APPLE-GRADE MOTION LAYER
// ============================================================
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const isTouchDevice = window.matchMedia("(hover: none)").matches;

// Hero title — split into words for staggered blur-up reveal
const initHeroTitle = () => {
  const title = document.getElementById("hero-title");
  if (!title || prefersReducedMotion) return;

  let wordIndex = 0;
  const wrapWords = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach((part) => {
        if (part.trim() === "") {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement("span");
          span.className = "word";
          span.style.setProperty("--i", wordIndex++);
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
      [...node.childNodes].forEach(wrapWords);
    }
  };
  [...title.childNodes].forEach(wrapWords);
};

// Header — frosted glass + shrink on scroll
const initHeaderScroll = () => {
  const header = document.getElementById("header");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
};

// Hero — subtle parallax fade-out on scroll (Apple product-page style)
const initHeroParallax = () => {
  if (prefersReducedMotion) return;
  const heroInner = document.querySelector(".hero-inner");
  const scrollCue = document.querySelector(".scroll-cue");
  if (!heroInner) return;

  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    if (y <= vh) {
      const progress = y / vh;
      heroInner.style.transform = `translateY(${(progress * 70).toFixed(1)}px) scale(${(1 - progress * 0.04).toFixed(4)})`;
      heroInner.style.opacity = Math.max(0, 1 - progress * 1.25).toFixed(3);
    }
    if (scrollCue) scrollCue.classList.toggle("hidden", y > 60);
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
};

// Glass cards — glow that follows the cursor
const initCardGlow = () => {
  if (isTouchDevice || prefersReducedMotion) return;
  document.querySelectorAll(".glass").forEach((card) => {
    card.addEventListener(
      "mousemove",
      (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      },
      { passive: true },
    );
  });
};

// Project cards — 3D tilt (Apple TV style)
const initTilt = () => {
  if (isTouchDevice || prefersReducedMotion) return;
  document.querySelectorAll(".project-card").forEach((card) => {
    let raf = null;
    card.addEventListener(
      "mousemove",
      (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
          raf = null;
        });
      },
      { passive: true },
    );
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
};

// Buttons — magnetic pull toward the cursor
const initMagnetic = () => {
  if (isTouchDevice || prefersReducedMotion) return;
  document.querySelectorAll(".btn, .nav-cta").forEach((el) => {
    el.addEventListener(
      "mousemove",
      (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      },
      { passive: true },
    );
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
};

// Timeline — line draws itself as you scroll, dots light up
const initTimelineProgress = () => {
  const track = document.querySelector(".timeline-track");
  if (!track) return;

  let ticking = false;
  const update = () => {
    const rect = track.getBoundingClientRect();
    const trigger = window.innerHeight * 0.7;
    const progress = Math.min(
      100,
      Math.max(0, ((trigger - rect.top) / rect.height) * 100),
    );
    track.style.setProperty("--tl-progress", `${progress.toFixed(1)}%`);
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();

  // Light up dots as items enter the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("lit");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3, rootMargin: "0px 0px -15% 0px" },
  );
  document
    .querySelectorAll(".timeline-item")
    .forEach((item) => observer.observe(item));
};

// Mobile Hamburger Menu
const initMobileMenu = () => {
  const burger = document.getElementById("nav-burger");
  const drawer = document.getElementById("nav-drawer");
  const closeBtn = document.getElementById("nav-drawer-close");

  if (!burger || !drawer) return;

  const openMenu = () => {
    drawer.classList.add("open");
    burger.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    drawer.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  burger.addEventListener("click", () => {
    drawer.classList.contains("open") ? closeMenu() : openMenu();
  });

  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  // Close when a link is clicked
  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Keep drawer links in sync with language switcher
  document.addEventListener("langChange", (e) => {
    const lang = e.detail;
    drawer.querySelectorAll("[data-pt]").forEach((el) => {
      const t = el.getAttribute(`data-${lang}`);
      if (t) el.innerText = t;
    });
  });
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  initHeroTitle();
  initHeaderScroll();
  initHeroParallax();
  initCardGlow();
  initTilt();
  initMagnetic();
  initTimelineProgress();
  initSpotlight();
  initLanguage();
  initScrollSpy();
  initMobileMenu();
  initScrollProgress();
  initBackToTop();

  // Smooth scroll offset
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });
});
