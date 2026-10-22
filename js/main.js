(() => {
  const WA_NUMBER = "260766593717";
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Every [data-wa] element opens WhatsApp with its own prefilled message
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = waLink(el.dataset.wa);
  });

  // Intro animation trigger
  requestAnimationFrame(() => document.documentElement.classList.add("is-loaded"));

  // Header state, floating button, active nav link
  const header = document.querySelector(".site-header");
  const fab = document.querySelector(".fab");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 20);
    fab.classList.toggle("show", y > window.innerHeight * 0.5);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const navLinks = [...document.querySelectorAll(".nav a")];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) sectionObserver.observe(target);
  });

  // Mobile menu
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("mobile-menu");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("open"));
    } else {
      menu.classList.remove("open");
      setTimeout(() => { if (!menu.classList.contains("open")) menu.hidden = true; }, 700);
    }
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false); });

  // Scroll reveal with light staggering among siblings
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.07}s`);
    revealObserver.observe(el);
  });

  // Pricing tabs
  const tabList = document.querySelector(".tabs");
  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const ink = tabList.querySelector(".tab-ink");
  const moveInk = (tab) => {
    ink.style.width = `${tab.offsetWidth}px`;
    ink.style.transform = `translateX(${tab.offsetLeft}px)`;
  };
  const selectTab = (tab, focus = false) => {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
    moveInk(tab);
    tabList.scrollTo({ left: tab.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (dir) selectTab(tabs[(i + dir + tabs.length) % tabs.length], true);
    });
  });
  moveInk(tabs[0]);
  window.addEventListener("resize", () => moveInk(tabs.find((t) => t.getAttribute("aria-selected") === "true")));
  document.fonts?.ready.then(() => moveInk(tabs.find((t) => t.getAttribute("aria-selected") === "true")));

  // Service cards deep-link into a pricing tab
  document.querySelectorAll("[data-tab]").forEach((link) => {
    link.addEventListener("click", () => selectTab(document.getElementById(`tab-${link.dataset.tab}`)));
  });

  // Gallery lightbox
  const lightbox = document.getElementById("lightbox");
  const lbImg = lightbox.querySelector("img");
  const lbCap = lightbox.querySelector(".lb-cap");
  document.querySelectorAll(".shot").forEach((shot) => {
    shot.addEventListener("click", () => {
      lbImg.src = shot.dataset.full;
      lbImg.alt = shot.querySelector("img").alt;
      lbCap.textContent = shot.dataset.cap;
      lightbox.showModal();
    });
  });
  lightbox.querySelector(".lb-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });

  // Hero card stack follows the pointer
  const stack = document.querySelector("[data-parallax]");
  if (stack && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    const hero = document.querySelector(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stack.style.transform = `perspective(1200px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translate(${x * 14}px, ${y * 10}px)`;
    });
    hero.addEventListener("pointerleave", () => { stack.style.transform = ""; });
  }

  // Brief form composes a WhatsApp message (no server needed)
  const form = document.getElementById("brief");
  const error = form.querySelector(".form-error");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const nameField = form.elements.name.closest(".field");
    const serviceField = form.elements.service.closest(".field");
    nameField.classList.toggle("invalid", !data.name?.trim());
    serviceField.classList.toggle("invalid", !data.service);
    if (!data.name?.trim() || !data.service) {
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const lines = [
      `Hi Zylvora Studio, I'm ${data.name.trim()}${data.business?.trim() ? ` from ${data.business.trim()}` : ""}.`,
      `I'm interested in: ${data.service}.`,
      data.budget ? `Budget: ${data.budget}.` : "",
      data.message?.trim() ? `\n${data.message.trim()}` : "",
    ].filter(Boolean);
    window.open(waLink(lines.join("\n")), "_blank", "noopener");
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
