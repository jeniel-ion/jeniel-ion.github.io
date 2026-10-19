/**
 * Command Palette — ⌘K surface for sections and journey commands.
 * Registry-driven: add an entry to buildItems() to add a capability.
 * Keeps the journey terminal commands (help, origin, journey, now, clear)
 * as typed actions, plus quick-jump rows for every section.
 */
(function initializeCommandPalette() {
    "use strict";

    var root = document.getElementById("paletteRoot");
    var bar = document.getElementById("paletteBar");
    var panel = document.getElementById("palettePanel");
    var input = document.getElementById("paletteInput");
    var results = document.getElementById("paletteResults");
    var output = document.getElementById("paletteOutput");
    var keyHint = document.getElementById("paletteKeyHint");
    if (!root || !bar || !panel || !input || !results || !output) {
        return;
    }

    var prefersReducedMotion = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var TYPE_DELAY_MS = 140;

    /* ------------------------------------------------------------------ *
     * Platform key hint.
     * ------------------------------------------------------------------ */
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    if (keyHint) {
        keyHint.textContent = isMac ? "⌘K" : "Ctrl K";
    }

    /* ------------------------------------------------------------------ *
     * Command output helpers (echo + typed replies).
     * ------------------------------------------------------------------ */
    var REPLY_CLASS_BY_KIND = {
        heading: "terminal-heading-line",
        stage: "terminal-stage-line",
        stageDetail: "terminal-stage-detail",
        error: "terminal-error-line",
        body: ""
    };

    function scrollOutputToBottom() {
        output.scrollTop = output.scrollHeight;
    }

    function appendCommandEcho(commandText, onTyped) {
        var row = document.createElement("div");
        row.className = "terminal-command-echo";
        var symbol = document.createElement("span");
        symbol.className = "terminal-echo-symbol";
        symbol.textContent = "➜";
        var label = document.createElement("span");
        label.textContent = commandText;
        row.appendChild(symbol);
        row.appendChild(label);
        output.appendChild(row);
        scrollOutputToBottom();
        if (onTyped) {
            onTyped();
        }
    }

    function appendSystemReply(replyText, replyKind) {
        var row = document.createElement("div");
        row.className = ["terminal-system-reply", REPLY_CLASS_BY_KIND[replyKind] || ""].join(" ").trim();
        row.textContent = replyText;
        output.appendChild(row);
        scrollOutputToBottom();
    }

    function typeSystemReplies(replyLines) {
        if (prefersReducedMotion) {
            replyLines.forEach(function (reply) {
                appendSystemReply(reply.text, reply.kind);
            });
            return;
        }
        var lineIndex = 0;
        (function typeNextLine() {
            if (lineIndex >= replyLines.length) {
                return;
            }
            var reply = replyLines[lineIndex];
            appendSystemReply(reply.text, reply.kind);
            lineIndex += 1;
            window.setTimeout(typeNextLine, TYPE_DELAY_MS);
        })();
    }

    /* ------------------------------------------------------------------ *
     * Command registry — same commands the old terminal offered.
     * ------------------------------------------------------------------ */
    function scrollToContactSection() {
        var contactSection = document.getElementById("contact");
        if (contactSection) {
            contactSection.scrollIntoView({behavior: prefersReducedMotion ? "auto" : "smooth"});
        }
    }

    function replyWithJourneyStages() {
        var stages = window.HackerJourneyStages || [];
        var replyLines = [];
        stages.forEach(function (stage, stageIndex) {
            replyLines.push({text: "0" + (stageIndex + 1) + "  " + stage.stageName, kind: "stage"});
            replyLines.push({text: "    " + stage.stageDetail, kind: "stageDetail"});
        });
        if (replyLines.length === 0) {
            replyLines.push({text: "No journey log found.", kind: "error"});
        }
        typeSystemReplies(replyLines);
    }

    var commandRegistry = {
        help: function () {
            typeSystemReplies([
                {text: "A glimpse into my journey so far. Type a command to dig deeper.", kind: "heading"},
                {text: "Commands: origin, journey, now, clear.", kind: "body"}
            ]);
        },
        origin: function () {
            typeSystemReplies([{text: "Curious kid.", kind: "body"}]);
        },
        journey: replyWithJourneyStages,
        now: function () {
            typeSystemReplies([
                {text: "Building toward AI security.", kind: "body"},
                {text: "Status: open to work — replies within 24 hours.", kind: "body"}
            ]);
        },
        clear: function () {
            output.innerHTML = "";
        }
    };

    /* ------------------------------------------------------------------ *
     * Palette items — sections (jump) + commands (run).
     * ------------------------------------------------------------------ */
    function makeJumpAction(sectionId) {
        return function jumpToSection() {
            var section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({behavior: prefersReducedMotion ? "auto" : "smooth", block: "start"});
                try {
                    section.focus({preventScroll: true});
                } catch (focusError) { /* focus is progressive enhancement only */ }
            }
            closePalette();
        };
    }

    function makeCommandAction(commandName) {
        return function runCommand() {
            showOutputView();
            appendCommandEcho(commandName, function () {
                var command = commandRegistry[commandName];
                if (command) {
                    command();
                } else {
                    appendSystemReply('Unknown command "' + commandName + '". Type help.', "error");
                }
            });
        };
    }

    function buildItems() {
        return [
            {code: "01", label: "About", hint: "jump", keywords: "about profile bio", action: makeJumpAction("about")},
            {code: "02", label: "Experience", hint: "jump", keywords: "experience work roles jobs", action: makeJumpAction("experience")},
            {code: "03", label: "Certifications", hint: "jump", keywords: "certs certification courses", action: makeJumpAction("certifications")},
            {code: "04", label: "Writeups", hint: "jump", keywords: "writeups articles blog", action: makeJumpAction("writeups")},
            {code: "05", label: "Research & Hall of Fame", hint: "jump", keywords: "research hof hall fame disclosures", action: makeJumpAction("research")},
            {code: "06", label: "Contact", hint: "jump", keywords: "contact email hire", action: makeJumpAction("contact")},
            {code: "cmd", label: "journey", hint: "run", keywords: "journey career log story", action: makeCommandAction("journey")},
            {code: "cmd", label: "origin", hint: "run", keywords: "origin kid start", action: makeCommandAction("origin")},
            {code: "cmd", label: "now", hint: "run", keywords: "now status currently", action: makeCommandAction("now")},
            {code: "cmd", label: "help", hint: "run", keywords: "help commands", action: makeCommandAction("help")},
            {code: "cmd", label: "clear", hint: "run", keywords: "clear reset", action: makeCommandAction("clear")}
        ];
    }

    var allItems = buildItems();
    var visibleItems = allItems.slice();
    var selectedIndex = 0;

    /* ------------------------------------------------------------------ *
     * Rendering.
     * ------------------------------------------------------------------ */
    function renderResults() {
        results.innerHTML = "";
        if (visibleItems.length === 0) {
            var empty = document.createElement("p");
            empty.className = "palette-empty";
            empty.textContent = "No matches. Try “journey” or a section name.";
            results.appendChild(empty);
            return;
        }
        visibleItems.forEach(function (item, itemIndex) {
            var row = document.createElement("button");
            row.type = "button";
            row.className = "palette-item";
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", itemIndex === selectedIndex ? "true" : "false");
            var code = document.createElement("span");
            code.className = "palette-item-code";
            code.textContent = item.code;
            var label = document.createElement("span");
            label.textContent = item.label;
            var hint = document.createElement("span");
            hint.className = "palette-item-hint";
            hint.textContent = item.hint;
            row.appendChild(code);
            row.appendChild(label);
            row.appendChild(hint);
            row.addEventListener("click", function () {
                item.action();
            });
            row.addEventListener("mousemove", function () {
                if (selectedIndex !== itemIndex) {
                    selectedIndex = itemIndex;
                    updateSelection();
                }
            });
            results.appendChild(row);
        });
    }

    function updateSelection() {
        var rows = results.querySelectorAll(".palette-item");
        rows.forEach(function (row, rowOffset) {
            var isSelected = rowOffset === selectedIndex;
            row.setAttribute("aria-selected", isSelected ? "true" : "false");
            if (isSelected && row.scrollIntoView) {
                row.scrollIntoView({block: "nearest"});
            }
        });
    }

    function filterItems() {
        var query = input.value.trim().toLowerCase();
        visibleItems = allItems.filter(function (item) {
            if (!query) {
                return true;
            }
            return item.label.toLowerCase().indexOf(query) !== -1 ||
                item.keywords.indexOf(query) !== -1 ||
                item.code.indexOf(query) !== -1;
        });
        selectedIndex = 0;
        renderResults();
    }

    function showOutputView() {
        output.hidden = false;
        results.hidden = true;
        input.value = "";
        input.placeholder = "Type another command…";
    }

    function showResultsView() {
        output.hidden = true;
        output.innerHTML = "";
        results.hidden = false;
        input.placeholder = "Type a command or section name…";
        filterItems();
    }

    /* ------------------------------------------------------------------ *
     * Open / close.
     * ------------------------------------------------------------------ */
    function openPalette() {
        root.setAttribute("data-open", "true");
        panel.hidden = false;
        bar.setAttribute("aria-expanded", "true");
        showResultsView();
        input.focus();
    }

    function closePalette() {
        root.setAttribute("data-open", "false");
        panel.hidden = true;
        bar.setAttribute("aria-expanded", "false");
        showResultsView();
        input.value = "";
    }

    function togglePalette() {
        if (panel.hidden) {
            openPalette();
        } else {
            closePalette();
        }
    }

    /* ------------------------------------------------------------------ *
     * Events.
     * ------------------------------------------------------------------ */
    bar.addEventListener("click", togglePalette);

    document.addEventListener("keydown", function (keyEvent) {
        if ((keyEvent.key === "k" || keyEvent.key === "K") && (keyEvent.metaKey || keyEvent.ctrlKey)) {
            keyEvent.preventDefault();
            togglePalette();
            return;
        }
        if (keyEvent.key === "Escape" && !panel.hidden) {
            if (!output.hidden) {
                showResultsView();
                return;
            }
            closePalette();
        }
    });

    input.addEventListener("input", function () {
        if (!output.hidden) {
            showResultsView();
        } else {
            filterItems();
        }
    });

    input.addEventListener("keydown", function (keyEvent) {
        if (keyEvent.key === "ArrowDown") {
            keyEvent.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1);
            updateSelection();
            return;
        }
        if (keyEvent.key === "ArrowUp") {
            keyEvent.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection();
            return;
        }
        if (keyEvent.key === "Enter") {
            keyEvent.preventDefault();
            var typedCommand = input.value.trim().toLowerCase();
            if (typedCommand && commandRegistry[typedCommand]) {
                makeCommandAction(typedCommand)();
                return;
            }
            var selected = visibleItems[selectedIndex];
            if (selected) {
                selected.action();
            }
        }
    });

    document.addEventListener("click", function (clickEvent) {
        if (panel.hidden) {
            return;
        }
        if (!root.contains(clickEvent.target)) {
            closePalette();
        }
    });

    /* ------------------------------------------------------------------ *
     * Public hook — lets the About "Open journey" button drive the palette.
     * ------------------------------------------------------------------ */
    window.JourneyPalette = {
        open: openPalette,
        close: closePalette,
        runCommand: function (commandName) {
            openPalette();
            if (commandRegistry[commandName]) {
                makeCommandAction(commandName)();
            }
        }
    };

    renderResults();


})();
