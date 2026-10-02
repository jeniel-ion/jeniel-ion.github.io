/**
 * Navigation Controller — mobile menu, smooth scroll, scroll-spy.
 * Back-to-top control intentionally removed for a cleaner interface.
 */
(function initializeNavigationController() {
  "use strict";
  var mobileMenuButton = document.getElementById("mobileMenuButton");
  var primaryNavigation = document.getElementById("primaryNavigation");
  var navigationLinks = document.querySelectorAll('.primary-navigation a[href^="#"]');
  if (mobileMenuButton && primaryNavigation) {
    mobileMenuButton.addEventListener("click", function handleMobileMenuClick() {
      var isOpen = primaryNavigation.classList.toggle("navigation-open");
      mobileMenuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileMenuButton.textContent = isOpen ? "Close" : "Menu";
    });
  }
  function scrollToSectionById(sectionId) {
    if (!sectionId) {
      return;
    }
    var targetElement = document.getElementById(sectionId);
    if (!targetElement) {
      return;
    }
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      targetElement.focus({ preventScroll: true });
    } catch (focusError) {
      /* focus is progressive enhancement only */
    }
  }
  navigationLinks.forEach(function attachNavigationHandler(linkElement) {
    linkElement.addEventListener("click", function handleNavigationClick(clickEvent) {
      var targetAttribute = linkElement.getAttribute("href") || "";
      if (targetAttribute.charAt(0) !== "#") {
        return;
      }
      var sectionId = targetAttribute.slice(1);
      if (!sectionId || sectionId === "top") {
        return;
      }
      clickEvent.preventDefault();
      scrollToSectionById(sectionId);
      window.history.replaceState(null, "", "#" + sectionId);
      if (primaryNavigation && primaryNavigation.classList.contains("navigation-open")) {
        primaryNavigation.classList.remove("navigation-open");
        if (mobileMenuButton) {
          mobileMenuButton.textContent = "Menu";
          mobileMenuButton.setAttribute("aria-expanded", "false");
        }
      }
    });
  });
  var observedSections = document.querySelectorAll(".content-section[id]");
  if ("IntersectionObserver" in window && observedSections.length > 0) {
    var sectionObserver = new IntersectionObserver(function handleIntersections(entries) {
      entries.forEach(function handleEntry(entry) {
        if (!entry.isIntersecting) {
          return;
        }
        var activeId = entry.target.getAttribute("id");
        document.querySelectorAll(".primary-navigation a").forEach(function clearActive(link) {
          var linkTarget = (link.getAttribute("href") || "").slice(1);
          link.classList.toggle("active-section", linkTarget === activeId);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    observedSections.forEach(function observeSection(section) {
      sectionObserver.observe(section);
    });
  }
})();
