(function () {
  function initAos() {
    if (!window.AOS) {
      return;
    }

    window.AOS.init({
      duration: window.matchMedia("(max-width: 768px)").matches ? 420 : 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 20
    });
  }

  function initScrollHover() {
    const scrollHoverCards = document.querySelectorAll("main .rounded-xl, main .rounded-lg");
    scrollHoverCards.forEach((card) => card.classList.add("scroll-hover"));

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
    );

    scrollHoverCards.forEach((card) => cardObserver.observe(card));
  }

  function initLiveClock() {
    const el = document.getElementById("local-clock");
    if (!el) {
      return;
    }

    function tick() {
      const now = new Date();
      const time = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Vancouver",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(now);
      el.textContent = time + " PT";
    }

    tick();
    setInterval(tick, 1000);
  }

  function initSite() {
    const page = document.body.getAttribute("data-page") || "index";

    if (window.SiteComponents && typeof window.SiteComponents.render === "function") {
      window.SiteComponents.render(page);
    }

    initAos();
    initScrollHover();
    initLiveClock();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSite);
  } else {
    initSite();
  }
})();
