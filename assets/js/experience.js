/* ============================================================
   EXPERIENCE LAYER
   Act 1 — agents select and commit each hero zone on load
   Act 2 — the backend architecture assembles itself on scroll
   Both degrade to "everything visible" if anything goes wrong.
   ============================================================ */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(hover: none)").matches;

  /* ---------- shared helpers ------------------------------- */
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ============================================================
     ACT 1 — THE AGENTS
     ============================================================ */
  // Neutral, glass-grey cursors — the colour belongs to the content, not
  // to the agents moving over it.
  const AGENTS = [
    { name: "arch", color: "rgba(255,255,255,0.86)" },
    { name: "impl", color: "rgba(255,255,255,0.72)" },
    { name: "test", color: "rgba(255,255,255,0.62)" },
    { name: "ops", color: "rgba(255,255,255,0.54)" },
  ];

  const POINTER_SVG = `
    <svg class="agent-pointer" width="19" height="21" viewBox="0 0 20 22" fill="none"
         xmlns="http://www.w3.org/2000/svg">
      <path d="M2 1.5 17.2 10.6l-6.6 1.1-3.3 6.1z"
            fill="currentColor" stroke="rgba(0,0,0,0.45)" stroke-width="1"
            stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;

  const buildHero = () => {
    const layer = document.getElementById("agent-layer");
    const zones = [...document.querySelectorAll(".build-zone")];
    const stamp = document.getElementById("governance-stamp");
    if (!zones.length) return;

    const commitAll = () => {
      zones.forEach((z) => z.setAttribute("data-build", "built"));
      if (stamp) stamp.classList.add("show");
      document
        .querySelectorAll(".hero-counters .count")
        .forEach((c) => window.startCounter && window.startCounter(c));
    };

    // No agents on reduced motion or without the layer: just show everything.
    if (!layer || reduced) {
      commitAll();
      return;
    }

    // Watchdog — the hero is never allowed to stay hidden.
    const watchdog = setTimeout(commitAll, 7000);

    const hero = document.getElementById("hero");
    const heroBox = () => hero.getBoundingClientRect();

    // Order the zones by their data-zone index so the build reads top-down.
    const ordered = zones
      .map((el) => ({ el, i: +(el.getAttribute("data-zone") || 0) }))
      .sort((a, b) => a.i - b.i);

    // Fewer agents on small screens — four cursors on a phone is noise.
    const roster = coarse ? AGENTS.slice(0, 2) : AGENTS;

    // shuffle the four edges once; each cursor takes a different one
    const edges = [0, 1, 2, 3].sort(() => Math.random() - 0.5);

    const cursors = roster.map((a, i) => {
      const el = document.createElement("div");
      el.className = "agent";
      el.style.setProperty("--agent-color", a.color);
      el.style.color = a.color;
      el.innerHTML = `${POINTER_SVG}<span class="agent-tag">${a.name}</span>`;
      layer.appendChild(el);

      // Enter from a random point on an edge nobody else is using, so the
      // group never reads as "everyone came from the left".
      const hb = heroBox();
      const edge = edges[i % edges.length];
      const spawn = [
        [Math.random() * hb.width, -110], // 0 top
        [hb.width + 110, Math.random() * hb.height], // 1 right
        [Math.random() * hb.width, hb.height + 110], // 2 bottom
        [-110, Math.random() * hb.height], // 3 left
      ][edge];

      return {
        el,
        color: a.color,
        x: spawn[0],
        y: spawn[1],
        tx: spawn[0],
        ty: spawn[1],
        ox: 0, // jostle offset, applied on top of the followed position
        oy: 0,
        ease: 0.18 + Math.random() * 0.08, // each one moves a little differently
      };
    });

    // Follow loop. During the swarm the cursors also shove each other, which
    // is what makes the opening look alive rather than scripted.
    let raf = null;
    let swarming = false;
    const tick = () => {
      cursors.forEach((c) => {
        c.x = lerp(c.x, c.tx, c.ease);
        c.y = lerp(c.y, c.ty, c.ease);
      });

      if (swarming) {
        // pairwise repulsion — they bump and deflect off one another
        for (let i = 0; i < cursors.length; i++) {
          for (let j = i + 1; j < cursors.length; j++) {
            const a = cursors[i];
            const b = cursors[j];
            const dx = b.x + b.ox - (a.x + a.ox);
            const dy = b.y + b.oy - (a.y + a.oy);
            const d = Math.hypot(dx, dy) || 1;
            if (d < 90) {
              const push = ((90 - d) / 90) * 5;
              const ux = dx / d;
              const uy = dy / d;
              a.ox -= ux * push;
              a.oy -= uy * push;
              b.ox += ux * push;
              b.oy += uy * push;
            }
          }
        }
      }
      // the shove always decays back toward zero
      cursors.forEach((c) => {
        c.ox *= 0.86;
        c.oy *= 0.86;
        c.el.style.transform = `translate3d(${(c.x + c.ox).toFixed(1)}px, ${(
          c.y + c.oy
        ).toFixed(1)}px, 0)`;
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    const selectZone = async (cursor, zone) => {
      const hb = heroBox();
      const zb = zone.getBoundingClientRect();
      const pad = 10;
      const left = zb.left - hb.left - pad;
      const top = zb.top - hb.top - pad;
      const w = zb.width + pad * 2;
      const h = zb.height + pad * 2;

      // pick which corner this selection is dragged FROM
      const fromRight = Math.random() < 0.5;
      const fromBottom = Math.random() < 0.5;
      const anchorX = fromRight ? left + w : left;
      const anchorY = fromBottom ? top + h : top;

      cursor.tx = anchorX;
      cursor.ty = anchorY;
      await wait(240);

      const marquee = document.createElement("div");
      marquee.className = "agent-marquee active";
      marquee.style.left = `${anchorX}px`;
      marquee.style.top = `${anchorY}px`;
      marquee.style.width = "0px";
      marquee.style.height = "0px";
      layer.appendChild(marquee);

      const t0 = performance.now();
      const DUR = 180;
      await new Promise((resolve) => {
        const grow = (now) => {
          const p = clamp((now - t0) / DUR, 0, 1);
          const e = easeInOut(p);
          const cw = w * e;
          const ch = h * e;
          // keep the anchored corner pinned; the opposite one travels
          marquee.style.width = `${cw}px`;
          marquee.style.height = `${ch}px`;
          marquee.style.left = `${fromRight ? left + w - cw : left}px`;
          marquee.style.top = `${fromBottom ? top + h - ch : top}px`;
          cursor.tx = fromRight ? left + w - cw : left + cw;
          cursor.ty = fromBottom ? top + h - ch : top + ch;
          if (p < 1) requestAnimationFrame(grow);
          else resolve();
        };
        requestAnimationFrame(grow);
      });

      await wait(60);

      zone.setAttribute("data-build", "built");
      if (zone.classList.contains("hero-counters")) {
        zone
          .querySelectorAll(".count")
          .forEach((c) => window.startCounter && window.startCounter(c));
      }
      marquee.classList.add("committing");
      setTimeout(() => marquee.remove(), 520);
    };

    const run = async () => {
      const hb = heroBox();

      // --- 1. swarm: everyone rushes in and mills about, bumping ---------
      swarming = true;
      cursors.forEach((c) => c.el.classList.add("live"));

      const wanderTo = (c) => {
        c.tx = hb.width * (0.2 + Math.random() * 0.6);
        c.ty = hb.height * (0.2 + Math.random() * 0.5);
      };
      cursors.forEach(wanderTo);

      const wander = setInterval(
        () => cursors.forEach((c) => Math.random() < 0.75 && wanderTo(c)),
        150,
      );
      await wait(780);
      clearInterval(wander);
      swarming = false;

      // --- 2. dispatch: each cursor claims the next zone, fast -----------
      let next = 0;
      const worker = async (cursor) => {
        while (next < ordered.length) {
          const job = ordered[next++];
          await selectZone(cursor, job.el);
          await wait(30);
        }
      };
      await Promise.all(cursors.map((c) => worker(c)));

      // --- 3. scatter out in random directions ---------------------------
      cursors.forEach((c) => {
        const ang = Math.random() * Math.PI * 2;
        c.ease = 0.1;
        c.tx = hb.width / 2 + Math.cos(ang) * (hb.width * 0.9);
        c.ty = hb.height / 2 + Math.sin(ang) * (hb.height * 0.9);
        c.el.classList.remove("live");
      });
      if (stamp) stamp.classList.add("show");
      await wait(520);
      cancelAnimationFrame(raf);
      layer.remove();
      clearTimeout(watchdog);
    };

    run().catch(() => {
      clearTimeout(watchdog);
      commitAll();
    });
  };

  /* ============================================================
     ACT 2 — THE SYSTEM ASSEMBLES
     ============================================================ */
  // Which node feeds which, for the wires on the floor.
  const EDGES = [
    [0, 1, "#818cf8", 2],
    [1, 2, "#22d3ee", 3],
    [1, 3, "#22d3ee", 3],
    [2, 4, "#a3e635", 4],
    [3, 4, "#a3e635", 4],
    [4, 5, "#34d399", 5],
    [2, 5, "#34d399", 5],
    [6, 1, "#34d399", 6],
  ];

  const buildSystem = () => {
    const scroll = document.getElementById("system-scroll");
    const world = document.getElementById("system-world");
    const rail = document.getElementById("system-rail");
    if (!scroll || !world) return;

    const nodes = [...world.querySelectorAll(".sys-node")];
    const caps = [...document.querySelectorAll("#system-caption .cap")];
    const px = (el, prop) => parseFloat(el.style.getPropertyValue(prop)) || 0;

    // Remember the authored layout so we can re-fit it to any viewport.
    const home = nodes.map((n) => ({
      x: px(n, "--x"),
      y: px(n, "--y"),
      h: px(n, "--h"),
    }));

    // --- build the wires once ---------------------------------
    const wires = EDGES.map(([a, b, color, stage], i) => {
      if (!nodes[a] || !nodes[b]) return null;
      const wire = document.createElement("div");
      wire.className = "sys-wire";
      wire.dataset.stage = String(stage);
      wire.dataset.a = String(a);
      wire.dataset.b = String(b);
      wire.style.setProperty("--wire-color", color);
      wire.innerHTML = `<span class="sys-packet" style="--pd:${(i * 0.27).toFixed(
        2,
      )}s"></span>`;
      world.insertBefore(wire, world.firstChild.nextSibling);
      return wire;
    }).filter(Boolean);

    /* The authored layout is ~800px wide. On a phone that overflows, so the
       whole graph is compressed toward the centre rather than zoomed out
       (zooming out would shrink the labels past readability). */
    const layout = () => {
      const spread = clamp(window.innerWidth / 1150, 0.46, 1);
      nodes.forEach((n, i) => {
        n.style.setProperty("--x", `${(home[i].x * spread).toFixed(1)}px`);
        n.style.setProperty("--y", `${(home[i].y * spread).toFixed(1)}px`);
        n.style.setProperty(
          "--h",
          `${(home[i].h * clamp(spread + 0.25, 0.6, 1)).toFixed(1)}px`,
        );
      });
      wires.forEach((w) => {
        const A = home[+w.dataset.a];
        const B = home[+w.dataset.b];
        const x1 = A.x * spread;
        const y1 = A.y * spread;
        const dx = B.x * spread - x1;
        const dy = B.y * spread - y1;
        w.style.setProperty("--wx", `${x1.toFixed(1)}px`);
        w.style.setProperty("--wy", `${y1.toFixed(1)}px`);
        w.style.setProperty(
          "--wa",
          `${((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(2)}deg`,
        );
        w.style.width = `${Math.hypot(dx, dy).toFixed(1)}px`;
      });
    };
    layout();

    // --- stage rail -------------------------------------------
    const STEPS = 7;
    if (rail) {
      for (let i = 0; i < STEPS; i++) rail.appendChild(document.createElement("i"));
    }
    const pips = rail ? [...rail.children] : [];

    // Reduced motion: present the finished system, no scroll choreography.
    if (reduced) {
      world.classList.add("floor-in");
      nodes.forEach((n) => n.classList.add("built"));
      wires.forEach((w) => w.classList.add("on"));
      caps.forEach((c, i) => c.classList.toggle("active", i === caps.length - 1));
      pips.forEach((p) => p.classList.add("on"));
      return;
    }

    let ticking = false;
    const update = () => {
      ticking = false;
      const r = scroll.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      const p = clamp(-r.top / total, 0, 1);

      // camera orbit + dolly
      const rx = lerp(72, 52, easeInOut(p));
      const rz = lerp(-52, -18, easeInOut(p));
      // trim the zoom and recentre on narrow screens so the far nodes
      // stay inside the viewport
      const narrow = window.innerWidth < 760;
      const fit = narrow ? 0.9 : 1;
      const zoom = lerp(0.78, 1.04, easeInOut(clamp(p * 1.15, 0, 1))) * fit;
      world.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      world.style.setProperty("--rz", `${rz.toFixed(2)}deg`);
      world.style.setProperty("--zoom", zoom.toFixed(3));
      world.style.setProperty("--ox", narrow ? "-16px" : "0px");

      // which construction step are we on
      const step = clamp(Math.floor(p * STEPS), 0, STEPS - 1);

      world.classList.toggle("floor-in", p > 0.02);
      nodes.forEach((n) =>
        n.classList.toggle("built", step >= +(n.dataset.stage || 0)),
      );
      wires.forEach((w) =>
        w.classList.toggle("on", step >= +(w.dataset.stage || 0)),
      );
      caps.forEach((c, i) => c.classList.toggle("active", i === step));
      pips.forEach((pip, i) => pip.classList.toggle("on", i <= step));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(
      "resize",
      () => {
        layout();
        onScroll();
      },
      { passive: true },
    );
    update();
  };

  /* ============================================================
     REVEAL ON SCROLL
     Replaces the ScrollReveal CDN: no external dependency, no stale
     geometry when the page grows, and nothing can stay stuck hidden.
     ============================================================ */
  const initReveals = () => {
    const els = [...document.querySelectorAll(".reveal")];
    if (!els.length) return;

    const show = (el) => el.classList.add("sr-finished");

    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(show);
      return;
    }

    // Stagger siblings that come into view together.
    const STEP = { "stack-item": 55, "project-card": 90, "timeline-item": 110 };
    const stepFor = (el) => {
      for (const cls in STEP) if (el.classList.contains(cls)) return STEP[cls];
      return 80;
    };

    const seen = new WeakSet();
    const io = new IntersectionObserver(
      (entries) => {
        // Group this batch by parent so delays read as a sequence.
        const byParent = new Map();
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e) => {
            const key = e.target.parentElement || document.body;
            if (!byParent.has(key)) byParent.set(key, []);
            byParent.get(key).push(e.target);
          });

        byParent.forEach((group) => {
          group
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
            .forEach((el, i) => {
              if (seen.has(el)) return;
              seen.add(el);
              el.style.setProperty("--rd", `${Math.min(i * stepFor(el), 600)}ms`);
              show(el);
              io.unobserve(el);
            });
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    els.forEach((el) => io.observe(el));

    // Safety net: nothing may remain invisible once the user has scrolled past it.
    setTimeout(() => {
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) show(el);
      });
    }, 2500);
  };

  /* ============================================================
     STACK — each tier snaps into place when it comes into view
     ============================================================ */
  const initStackTiers = () => {
    const tiers = [...document.querySelectorAll(".stack-tier")];
    if (!tiers.length) return;

    // Stagger the chips inside each tier.
    tiers.forEach((tier) => {
      [...tier.querySelectorAll(".stack-item")].forEach((chip, i) => {
        chip.style.setProperty("--d", `${120 + i * 70}ms`);
      });
    });

    if (reduced || !("IntersectionObserver" in window)) {
      tiers.forEach((t) => t.classList.add("assembled"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("assembled");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
    );
    tiers.forEach((t) => io.observe(t));

    setTimeout(() => {
      tiers.forEach((t) => {
        if (t.getBoundingClientRect().top < window.innerHeight)
          t.classList.add("assembled");
      });
    }, 2500);
  };

  /* ============================================================
     CONSOLE — a terminal that types the summary out
     ============================================================ */
  const PROMPT = "guilherme@portfolio:~$ ";
  const SCRIPT = {
    pt: [
      ["cmd", "whoami"],
      ["out", "Guilherme Baltazar — Backend Software Engineer"],
      ["out", "7+ anos construindo o backbone de sistemas críticos"],
      ["gap", ""],
      ["cmd", "cat stack.core"],
      ["out", "java@17  spring-boot  spring-data  spring-batch"],
      ["out", "apache-kafka  postgresql  oracle  docker  gitlab-ci"],
      ["gap", ""],
      ["cmd", "./como-eu-trabalho.sh"],
      ["step", "lendo o requisito ................. ok"],
      ["step", "desenhando a arquitetura .......... ok"],
      ["step", "mapeando risco e performance ...... ok"],
      ["step", "só então escrevendo código ........ ok"],
      ["gap", ""],
      ["done", "build estável · sem surpresa em produção"],
      ["gap", ""],
    ],
    en: [
      ["cmd", "whoami"],
      ["out", "Guilherme Baltazar — Backend Software Engineer"],
      ["out", "7+ years building the backbone of mission-critical systems"],
      ["gap", ""],
      ["cmd", "cat stack.core"],
      ["out", "java@17  spring-boot  spring-data  spring-batch"],
      ["out", "apache-kafka  postgresql  oracle  docker  gitlab-ci"],
      ["gap", ""],
      ["cmd", "./how-i-work.sh"],
      ["step", "reading the requirement ........... ok"],
      ["step", "drawing the architecture .......... ok"],
      ["step", "mapping risk and performance ...... ok"],
      ["step", "only then writing code ............ ok"],
      ["gap", ""],
      ["done", "stable build · no surprises in production"],
      ["gap", ""],
    ],
  };

  const initConsole = () => {
    const term = document.getElementById("terminal");
    const body = document.getElementById("term-body");
    if (!term || !body) return;

    const esc = (t) =>
      t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const lang = () => (document.body.getAttribute("data-lang") === "en" ? "en" : "pt");

    let runId = 0;

    const renderAll = (lines) => {
      body.innerHTML =
        lines
          .map(([kind, text]) => {
            if (kind === "gap") return '<span class="ln"> </span>';
            const t = esc(text).replace(/\bok$/, "<b>ok</b>");
            if (kind === "cmd")
              return `<span class="ln"><span class="pr">${esc(
                PROMPT,
              )}</span><span class="cmd">${esc(text)}</span></span>`;
            return `<span class="ln ${kind}">${t}</span>`;
          })
          .join("") +
        `<span class="ln"><span class="pr">${esc(
          PROMPT,
        )}</span><span class="term-caret"></span></span>`;
    };

    const type = async (lines) => {
      const me = ++runId;
      body.innerHTML = "";
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      for (const [kind, text] of lines) {
        if (me !== runId) return; // language changed mid-run
        const ln = document.createElement("span");
        ln.className = `ln ${kind}`;
        body.appendChild(ln);

        if (kind === "gap") {
          ln.innerHTML = "&nbsp;";
          await sleep(90);
          continue;
        }

        if (kind === "cmd") {
          const pr = document.createElement("span");
          pr.className = "pr";
          pr.textContent = PROMPT;
          ln.appendChild(pr);
          const c = document.createElement("span");
          c.className = "cmd";
          ln.appendChild(c);
          for (let i = 0; i < text.length; i++) {
            if (me !== runId) return;
            c.textContent += text[i];
            await sleep(26);
          }
          await sleep(220);
          continue;
        }

        // output lines stream in faster, a few chars at a time
        for (let i = 0; i < text.length; i += 2) {
          if (me !== runId) return;
          ln.textContent = text.slice(0, i + 2);
          await sleep(7);
        }
        ln.textContent = text;
        if (kind === "step") ln.innerHTML = esc(text).replace(/\bok$/, "<b>ok</b>");
        await sleep(kind === "step" ? 60 : 110);
      }

      if (me !== runId) return;
      const tail = document.createElement("span");
      tail.className = "ln";
      tail.innerHTML = `<span class="pr">${esc(
        PROMPT,
      )}</span><span class="term-caret"></span>`;
      body.appendChild(tail);
    };

    if (reduced || !("IntersectionObserver" in window)) {
      renderAll(SCRIPT[lang()]);
      document.addEventListener("langChange", () => renderAll(SCRIPT[lang()]));
      return;
    }

    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || started) return;
          started = true;
          io.disconnect();
          type(SCRIPT[lang()]);
        });
      },
      { threshold: 0.3 },
    );
    io.observe(term);

    // retype in the new language if the visitor flips the switch
    document.addEventListener("langChange", () => {
      if (started) type(SCRIPT[lang()]);
    });
  };

  /* ---------- boot ----------------------------------------- */
  const boot = () => {
    try {
      initConsole();
    } catch (e) {
      /* the terminal simply stays empty */
    }
    try {
      initStackTiers();
    } catch (e) {
      document
        .querySelectorAll(".stack-tier")
        .forEach((t) => t.classList.add("assembled"));
    }
    try {
      initReveals();
    } catch (e) {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("sr-finished"));
    }
    try {
      buildHero();
    } catch (e) {
      document
        .querySelectorAll(".build-zone")
        .forEach((z) => z.setAttribute("data-build", "built"));
    }
    try {
      buildSystem();
    } catch (e) {
      /* the section still renders, just without the choreography */
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
