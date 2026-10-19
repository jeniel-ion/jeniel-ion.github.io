/**
 * Site Application � portfolio render engine.
 * Production rules: one function per concern, every data-driven HTML
 * write passes through escapeHtml, every DOM access is null-guarded.
 */
(function initializeSiteApplication() {
    "use strict";

    var THEME_NAMES = ["dark", "light"];
    var THEME_LABELS = ["Dark", "Light"];
    var THEME_STORAGE_KEY = "portfolio-color-theme";

    var siteContent = window.SiteContent;
    if (!siteContent) {
        return;
    }

    /* ------------------------------------------------------------------
     * Shared state � one snapshot every renderer reads from.
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
     * Typing effect � hero boot sequence.
     * ------------------------------------------------------------------ */
    var prefersReducedMotion = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    function makeTypeCursor() {
        var cursor = document.createElement("span");
        cursor.className = "type-cursor";
        cursor.setAttribute("aria-hidden", "true");
        return cursor;
    }

    function typeTextLines(element, lines, speedMs, lineDelayMs, onDone) {
        var cursor = makeTypeCursor();
        var typedLines = [];
        var lineIndex = 0;
        var charIndex = 0;
        function step() {
            var currentLine = lines[lineIndex];
            if (charIndex < currentLine.length) {
                charIndex += 1;
                typedLines[lineIndex] = currentLine.slice(0, charIndex);
            } else {
                typedLines[lineIndex] = currentLine;
                lineIndex += 1;
                charIndex = 0;
            }
            element.textContent = typedLines.join("\n");
            element.appendChild(cursor);
            if (lineIndex >= lines.length) {
                if (onDone) { onDone(cursor); }
                return;
            }
            window.setTimeout(step, charIndex === 0 ? lineDelayMs : speedMs);
        }
        step();
    }

    /* ------------------------------------------------------------------
     * Section renderers.
     * ------------------------------------------------------------------ */
    function renderHero() {
        setText("heroSummary", siteContent.profile.headlineSummary);
        var heroTerminal = byId("heroTerminalBody");
        var terminalLines = [
            "> cat journey.log",
            "",
            "Building my instincts, one vulnerability at a time"
        ];

        if (!heroTerminal) {
            return;
        }
        if (prefersReducedMotion) {
            heroTerminal.textContent = terminalLines.join("\n");
            return;
        }
        heroTerminal.textContent = "";
        window.setTimeout(function () {
            typeTextLines(heroTerminal, terminalLines, 18, 120);
        }, 250);
    }

    function openJourneyPalette() {
        if (window.JourneyPalette) {
            window.JourneyPalette.runCommand("journey");
        }
    }

    function renderAboutSummary() {
        var summary = window.AboutSummary;
        if (summary) {
            setText("aboutSummaryLine", summary.firstLine + " " + summary.secondLine);
        }
        var openJourneyButton = byId("openJourneyFromAbout");
        if (openJourneyButton) {
            openJourneyButton.addEventListener("click", openJourneyPalette);
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
        var proofLink = record.proofLink
            ? '<a class="hall-proof-link" href="' + escapeHtml(record.proofLink) +
                '" target="_blank" rel="noopener noreferrer" title="' +
                escapeHtml(record.proofNote || "View proof") +
                '" aria-label="View proof for ' +
                escapeHtml(record.targetOrganization) + '">Hall of Fame<span aria-hidden="true"></span>🔗</a>'
            : "";
        var severityKey = String(record.severityLevel || "low").toLowerCase();
        var severityClass = severityKey === "high" ? "severity-high"
            : severityKey === "medium" ? "severity-medium" : "severity-low";
        return '<div class="hall-row"><span class="' + severityClass + '">' + escapeHtml(record.severityLevel) +
            '</span><div><strong>' + escapeHtml(record.targetOrganization) +
            "</strong><small>" + escapeHtml(record.vulnerabilityClass) + " > " +
            escapeHtml(record.disclosureYear) + "</small></div>" + proofLink + "</div>";
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
            escapeHtml(writeup.articleTag) + " > " + escapeHtml(writeup.readingTime) +
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
                var label = themeButton.querySelector(".theme-label");
                if (label) {
                    label.textContent = THEME_LABELS[activeIndex];
                }
                themeButton.title = "Switch color theme (currently " + THEME_LABELS[activeIndex] + ")";
                themeButton.setAttribute("aria-label", "Switch color theme. Current: " + THEME_LABELS[activeIndex] + ". Activate to change.");
            }
        }

        applyTheme();
        if (themeButton) {
            themeButton.addEventListener("click", function () {
                activeIndex = (activeIndex + 1) % THEME_NAMES.length;
                applyTheme();
                try {
                    window.localStorage.setItem(THEME_STORAGE_KEY, THEME_NAMES[activeIndex]);
                } catch (storageWriteError) { /* private browsing � theme stays session-only */
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
     * Boot � explicit call order, no implicit execution.
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
