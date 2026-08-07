(function () {
  const ICONS = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    architecture: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>',
    projects: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0.5-5"/><path d="M6.5 15H20"/></svg>',
    timeline: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  };

  const NAV_LINKS = [
    { href: "/", key: "nav.home", fallback: "Home", icon: "home" },
    { href: "/architecture.html", key: "nav.architecture", fallback: "Architecture", icon: "architecture" },
    { href: "/projects.html", key: "nav.projects", fallback: "Projects", icon: "projects" },
    { href: "/timeline.html", key: "nav.timeline", fallback: "Timeline", icon: "timeline" }
  ];

  const LANGUAGES = [
    { code: "en", label: "EN" },
    { code: "fr", label: "FR" },
    { code: "de", label: "DE" },
    { code: "es", label: "ES" },
    { code: "it", label: "IT" },
    { code: "pt", label: "PT" },
    { code: "ru", label: "RU" },
    { code: "zh", label: "ZH" },
    { code: "ja", label: "JA" }
  ];

  const PAGE_CONFIG = {
    index: {
      desktop: ["/architecture.html", "/projects.html", "/timeline.html"],
      topMobile: { type: "text", label: "Home" }
    },
    architecture: {
      desktop: ["/architecture.html", "/projects.html", "/timeline.html"],
      topMobile: { type: "link", href: "/", label: "Home" }
    },
    projects: {
      desktop: ["/architecture.html", "/projects.html", "/timeline.html"],
      topMobile: { type: "link", href: "/", label: "Home" }
    },
    timeline: {
      desktop: ["/architecture.html", "/projects.html", "/timeline.html"],
      topMobile: { type: "link", href: "/", label: "Home" }
    }
  };

  const DESKTOP_LABELS = {
    "/architecture.html": { key: "nav.architecture", fallback: "Architecture" },
    "/projects.html": { key: "nav.projects", fallback: "Projects" },
    "/timeline.html": { key: "nav.timeline", fallback: "Timeline" }
  };

  function renderLanguageSwitcher(containerClass) {
    const switchers = LANGUAGES.map((lang) => {
      return (
        '<button data-lang-switch="' +
        lang.code +
        '" data-i18n-attr="aria-label:lang.switch_to_' +
        lang.code +
        '" class="px-2 py-1 rounded border border-line/50 text-[10px] font-mono uppercase tracking-[0.08em] text-muted hover:text-accent hover:border-accent/50 transition">' +
        lang.label +
        "</button>"
      );
    }).join("");

    return '<div class="' + containerClass + '">' + switchers + "</div>";
  }

  function renderMobileLanguageSelector() {
    const options = LANGUAGES.map((lang) => {
      return '<option value="' + lang.code + '">' + lang.label + '</option>';
    }).join("");

    return (
      '<label class="mobile-lang-wrap">' +
      '<span class="sr-only">Language</span>' +
      '<select data-lang-select class="mobile-lang-select" aria-label="Language selector">' +
      options +
      "</select>" +
      "</label>"
    );
  }

  function normalizePath(pathname) {
    if (!pathname || pathname === "/") {
      return "/";
    }
    return pathname;
  }

  function renderHeader(page) {
    const headerSlot = document.getElementById("site-header");
    if (!headerSlot) {
      return;
    }

    const config = PAGE_CONFIG[page] || PAGE_CONFIG.index;
    const currentPath = normalizePath(window.location.pathname);

    const desktopLinks = config.desktop
      .map((href) => {
        const isActive = currentPath === href;
        const linkClass = isActive ? "text-accent" : "hover:text-accent";
        return '<a href="' + href + '" data-i18n="' + DESKTOP_LABELS[href].key + '" class="' + linkClass + '">' + DESKTOP_LABELS[href].fallback + '</a>';
      })
      .join("");

    const topMobileLabel = (page === "index")
      ? { key: "nav.portfolio", fallback: "Portfolio" }
      : (DESKTOP_LABELS["/" + page + ".html"] || { key: "nav.portfolio", fallback: "Portfolio" });

    headerSlot.innerHTML =
      '<header class="sticky top-0 z-30 border-b border-line/50 backdrop-blur bg-bg/80">' +
      '<div class="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">' +
      '<a href="/" class="font-heading font-semibold text-2xl tracking-tight">BINNI CORDOVA</a>' +
      '<div class="hidden md:flex items-center gap-4">' +
      '<nav class="flex gap-6 text-xs uppercase tracking-[0.14em] font-mono text-muted">' +
      desktopLinks +
      "</nav>" +
      renderLanguageSwitcher("flex items-center gap-1") +
      "</div>" +
        '<div class="md:hidden flex items-center gap-2">' +
      '<span data-i18n="' + topMobileLabel.key + '" class="text-[10px] font-mono uppercase tracking-[0.2em] text-accent/80">' + topMobileLabel.fallback + '</span>' +
        renderMobileLanguageSelector() +
      "</div>" +
      "</div>" +
      "</header>";
  }

  function renderMobileNav(page) {
    const navSlot = document.getElementById("site-mobile-nav");
    if (!navSlot) {
      return;
    }

    const currentPath = normalizePath(window.location.pathname);

    const links = NAV_LINKS.map((item) => {
      const isActive = currentPath === item.href || (item.href === "/" && (currentPath === "" || currentPath === "/index.html"));
      const textClass = isActive ? "text-accent" : "text-muted";
      const icon = ICONS[item.icon] || "";
      return (
        '<a href="' +
        item.href +
        '" class="' +
        textClass +
        ' flex flex-col items-center justify-center">' +
        icon +
        '<span data-i18n="' +
        item.key +
        '">' +
        item.fallback +
        "</span>" +
        "</a>"
      );
    }).join("");

    navSlot.innerHTML =
      '<nav class="mobile-nav fixed bottom-0 left-0 right-0 md:hidden border-t border-line/60 bg-bg/90 backdrop-blur px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-around text-[10px] uppercase tracking-[0.1em] font-mono z-40">' +
      links +
      "</nav>";
  }

  window.SiteComponents = {
    render: function (page) {
      renderHeader(page);
      renderMobileNav(page);
    }
  };
})();
