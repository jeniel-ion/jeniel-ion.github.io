/**
 * Site Application — portfolio render engine.
 * Production rules: one function per concern, every data-driven HTML
 * write passes through escapeHtml, every DOM access is null-guarded.
 */
(function initializeSiteApplication() {
    "use strict";

    var THEME_NAMES = ["green", "amber", "paper"];
    var THEME_LABELS = ["Green", "Amber", "Paper"];
    var THEME_STORAGE_KEY = "portfolio-color-theme";

    var siteContent = window.SiteContent;
    if (!siteContent) {
        return;
    }

    /* ------------------------------------------------------------------
     * Shared state — one snapshot every renderer reads from.
     * ------------------------------------------------------------------ */
    function buildSharedState() {
        return {
            disclosureRecords: window.DisclosureRecords || [],
            compactExperience: window.ExperienceCompactList || [],
            compactCertifications: window.CertificationCompactList || [],
            featuredWriteup: window.FeaturedWriteup || null
        };
    }

    var sharedState = buildSharedState();

    /* ------------------------------------------------------------------
     * DOM utilities.
     * ------------------------------------------------------------------ */
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function setText(id, text) {
        var element = byId(id);
        if (element) {
            element.textContent = text;
        }
    }

    function setHtml(id, html) {
        var element = byId(id);
        if (element) {
            element.innerHTML = html;
        }
    }

    /* ------------------------------------------------------------------
     * Section renderers.
     * ------------------------------------------------------------------ */
    function renderHero() {
        setText("heroSummary", siteContent.profile.headlineSummary);
        var heroTerminal = byId("heroTerminalBody");
        if (heroTerminal) {
            heroTerminal.textContent = [
                "$ cat ~/journey.txt",
                "Juggling my way through the world of security, one exploit at a time.",
                "",
                "$ tap the terminal below to see how I got here →"
            ].join("\n");
        }
    }

    function openJourneyTerminal() {
        var dockHeader = byId("terminalDockHeader");
        var dockBody = byId("terminalDockBody");
        if (dockHeader && dockBody && dockBody.hidden) {
            dockHeader.click();
        }
        var terminalInput = byId("terminalInput");
        if (terminalInput) {
            terminalInput.focus();
        }
    }

    function renderAboutSummary() {
        var summary = window.AboutSummary;
        if (summary) {
            setText("aboutSummaryLine", summary.firstLine + " " + summary.secondLine);
        }
        var openJourneyButton = byId("openJourneyFromAbout");
        if (openJourneyButton) {
            openJourneyButton.addEventListener("click", openJourneyTerminal);
        }
    }

    function renderExperienceRows() {
        var rows = sharedState.compactExperience.map(function (role) {
            var currentBadge = role.isCurrent ? '<span class="current-badge">Current</span>' : "";
            return '<div class="compact-row"><div><strong>' + escapeHtml(role.jobTitle) +
                "</strong>" + currentBadge + "</div><span>" + escapeHtml(role.organizationName) + "</span></div>";
        }).join("");
        setHtml("experienceTimeline", rows);
    }

    function renderCertificationCards() {
        var cards = sharedState.compactCertifications.map(function (certificate) {
            return '<div class="compact-card"><strong>' + escapeHtml(certificate.certificateTitle) +
                "</strong><span>" + escapeHtml(certificate.issuingOrganization) + "</span></div>";
        }).join("");
        setHtml("certificationGrid", cards);
    }

    function buildHallRow(record) {
        return '<div class="hall-row"><span class="severity-high">' + escapeHtml(record.severityLevel) +
            '</span><div><strong>' + escapeHtml(record.targetOrganization) +
            "</strong><small>" + escapeHtml(record.vulnerabilityClass) + " • " +
            escapeHtml(record.disclosureYear) + "</small></div></div>";
    }

    function renderResearchHall(filterKey) {
        var rows = sharedState.disclosureRecords
            .filter(function (record) {
                return filterKey === "All" || record.filterKey === filterKey;
            })
            .map(buildHallRow)
            .join("");
        setHtml("researchGrid", rows);
    }

    function wireResearchFilters() {
        var filterRow = byId("researchFilterRow");
        if (!filterRow) {
            return;
        }
        filterRow.addEventListener("click", function (clickEvent) {
            var selectedButton = clickEvent.target.closest("[data-research-filter]");
            if (!selectedButton) {
                return;
            }
            filterRow.querySelectorAll(".filter-button").forEach(function (button) {
                button.classList.remove("active-filter");
            });
            selectedButton.classList.add("active-filter");
            renderResearchHall(selectedButton.getAttribute("data-research-filter"));
        });
    }

    function renderFeaturedWriteup() {
        var writeup = sharedState.featuredWriteup;
        if (!writeup) {
            return;
        }
        var card = '<article class="information-card"><p class="muted-text">' +
            escapeHtml(writeup.articleTag) + " • " + escapeHtml(writeup.readingTime) +
            "</p><h3>" + escapeHtml(writeup.articleTitle) + "</h3><p>" +
            escapeHtml(writeup.articleSummary) + '</p><a class="feature-link" href="' +
            escapeHtml(writeup.articlePage) + '">Read the writeup</a></article>';
        setHtml("writeupGrid", card);
    }

    /* ------------------------------------------------------------------
     * Interactions.
     * ------------------------------------------------------------------ */
    function initThemeSwitcher() {
        var themeButton = byId("themeSwitcherButton");
        var activeIndex = 0;
        try {
            var savedIndex = THEME_NAMES.indexOf(window.localStorage.getItem(THEME_STORAGE_KEY));
            if (savedIndex !== -1) {
                activeIndex = savedIndex;
            }
        } catch (storageReadError) {
            activeIndex = 0;
        }

        function applyTheme() {
            document.body.setAttribute("data-color-theme", THEME_NAMES[activeIndex]);
            if (themeButton) {
                themeButton.textContent = THEME_LABELS[activeIndex];
            }
        }

        applyTheme();
        if (themeButton) {
            themeButton.addEventListener("click", function () {
                activeIndex = (activeIndex + 1) % THEME_NAMES.length;
                applyTheme();
                try {
                    window.localStorage.setItem(THEME_STORAGE_KEY, THEME_NAMES[activeIndex]);
                } catch (storageWriteError) { /* private browsing — theme stays session-only */
                }
            });
        }
    }

    function initCopyButtons() {
        document.querySelectorAll("[data-copy-value]").forEach(function (copyButton) {
            copyButton.addEventListener("click", function () {
                var valueToCopy = copyButton.getAttribute("data-copy-value") || "";

                function confirmCopied() {
                    copyButton.textContent = "Copied";
                    window.setTimeout(function () {
                        copyButton.textContent = "Copy";
                    }, 1500);
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(valueToCopy).then(confirmCopied, confirmCopied);
                } else {
                    window.prompt("Copy this value:", valueToCopy);
                    confirmCopied();
                }
            });
        });
    }

    /* ------------------------------------------------------------------
     * Boot — explicit call order, no implicit execution.
     * ------------------------------------------------------------------ */
    function initPortfolio() {
        renderHero();
        renderAboutSummary();
        renderExperienceRows();
        renderCertificationCards();
        renderResearchHall("All");
        wireResearchFilters();
        renderFeaturedWriteup();
        initThemeSwitcher();
        initCopyButtons();
    }

    initPortfolio();
})();
