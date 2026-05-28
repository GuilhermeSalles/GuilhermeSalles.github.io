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

// Reveal Targets
sr.reveal(".reveal", { interval: 100 });
sr.reveal(".status-pill", { delay: 300 });
sr.reveal(".hero-title", { delay: 500, distance: "100px" });
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
  const spotlight = document.querySelector(".spotlight");
  window.addEventListener(
    "mousemove",
    (e) => {
      const x = e.clientX;
      const y = e.clientY;
      spotlight.style.transform = `translate(${x - 300}px, ${y - 300}px)`;
    },
    { passive: true },
  );
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
  initSpotlight();
  initLanguage();
  initScrollSpy();
  initMobileMenu();

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
