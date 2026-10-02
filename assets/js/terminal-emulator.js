/**
 * Journey Terminal — display layer.
 * Command echoes and system replies are visually distinct by design:
 * echo = what you typed (bold green + amber $), reply = system output.
 */
(function initializeJourneyTerminalDisplay() {
    "use strict";

    var TYPE_DELAY_MS = 140;
    var state = (window.JourneyTerminalState = window.JourneyTerminalState || {});
    state.commandHistory = [];
    state.historyPosition = 0;

    function getOutput() {
        return document.getElementById("terminalOutput");
    }

    function scrollOutputToBottom(output) {
        output.scrollTop = output.scrollHeight;
    }

    function appendCommandEcho(commandText) {
        var output = getOutput();
        if (!output) {
            return;
        }
        var row = document.createElement("div");
        row.className = "terminal-command-echo";
        var symbol = document.createElement("span");
        symbol.className = "terminal-echo-symbol";
        symbol.textContent = "$";
        var label = document.createElement("span");
        label.className = "terminal-echo-text";
        label.textContent = commandText;
        row.appendChild(symbol);
        row.appendChild(label);
        output.appendChild(row);
        scrollOutputToBottom(output);
    }

    var REPLY_CLASS_BY_KIND = {
        heading: "terminal-heading-line",
        stage: "terminal-stage-line",
        error: "terminal-error-line",
        body: ""
    };

    function appendSystemReply(replyText, replyKind) {
        var output = getOutput();
        if (!output) {
            return;
        }
        var row = document.createElement("div");
        row.className = ["terminal-system-reply", REPLY_CLASS_BY_KIND[replyKind] || ""].join(" ").trim();
        row.textContent = replyText;
        output.appendChild(row);
        scrollOutputToBottom(output);
    }

    function typeSystemReplies(replyLines) {
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

    state.appendCommandEcho = appendCommandEcho;
    state.appendSystemReply = appendSystemReply;
    state.typeSystemReplies = typeSystemReplies;
})();
/**
 * Journey Terminal — command layer.
 * Registry-driven: add a command by adding one entry to `commands`.
 * Supports command history (ArrowUp/ArrowDown) and dock open/close.
 */
(function initializeJourneyTerminalCommands() {
    "use strict";

    var HISTORY_LIMIT = 60;
    var output = document.getElementById("terminalOutput");
    var input = document.getElementById("terminalInput");
    var dockHeader = document.getElementById("terminalDockHeader");
    var dockBody = document.getElementById("terminalDockBody");
    if (!output || !input) {
        return;
    }

    var terminal = window.JourneyTerminalState;

    /* ------------------------------------------------------------------
     * Reply helpers.
     * ------------------------------------------------------------------ */
    function replyWithPlainLines(lines) {
        terminal.typeSystemReplies(lines.map(function (text) {
            return {text: text, kind: "body"};
        }));
    }

    function replyWithJourneyStages() {
        var stages = window.HackerJourneyStages || [];
        terminal.typeSystemReplies(stages.map(function (stage, stageIndex) {
            return {
                text: "0" + (stageIndex + 1) + "  " + stage.stageName + " — " + stage.stageDetail,
                kind: "stage"
            };
        }));
    }

    function scrollToContactSection() {
        var contactSection = document.getElementById("contact");
        if (contactSection) {
            contactSection.scrollIntoView({behavior: "smooth"});
        }
    }

    /* ------------------------------------------------------------------
     * Command registry.
     * ------------------------------------------------------------------ */
    var commands = {
        help: {
            execute: function () {
                replyWithPlainLines(["Commands: origin, journey, now, hireme, clear."]);
            }
        },
        origin: {
            execute: function () {
                replyWithPlainLines([
                    "Curious kid.",
                ]);
            }
        },
        journey: {execute: replyWithJourneyStages},
        now: {
            execute: function () {
                replyWithPlainLines([
                    "Building toward AI security.",
                    "Status: OPEN TO WORK. ( Expect Replies within 24 hours.)"
                ]);
            }
        },
        hireme: {
            execute: function () {
                replyWithPlainLines(["Secure channel: jeniels72@gmail.com"]);
                scrollToContactSection();
            }
        },
        clear: {
            execute: function () {
                output.innerHTML = "";
            }
        }
    };

    /* ------------------------------------------------------------------
     * Command execution + history.
     * ------------------------------------------------------------------ */
    function runCommand(rawCommand) {
        var commandName = rawCommand.trim().toLowerCase();
        if (!commandName) {
            return;
        }
        terminal.appendCommandEcho(rawCommand.trim());
        var command = commands[commandName];
        if (command) {
            command.execute();
        } else {
            terminal.appendSystemReply('Unknown command "' + commandName + '". Type help.', "error");
        }
    }

    function pushHistory(value) {
        terminal.commandHistory.push(value);
        if (terminal.commandHistory.length > HISTORY_LIMIT) {
            terminal.commandHistory.shift();
        }
        terminal.historyPosition = terminal.commandHistory.length;
    }

    function submitInput() {
        pushHistory(input.value);
        runCommand(input.value);
        input.value = "";
    }

    function wireInputHistory() {
        var submitButton = document.getElementById("terminalSubmitButton");
        if (submitButton) {
            submitButton.addEventListener("click", function () {
                submitInput();
                input.focus();
            });
        }
        input.addEventListener("keydown", function (keyEvent) {
            if (keyEvent.key === "Enter") {
                submitInput();
                return;
            }
            if (keyEvent.key === "ArrowUp") {
                keyEvent.preventDefault();
                terminal.historyPosition = Math.max(0, terminal.historyPosition - 1);
                input.value = terminal.commandHistory[terminal.historyPosition] || "";
            }
            if (keyEvent.key === "ArrowDown") {
                keyEvent.preventDefault();
                terminal.historyPosition = Math.min(terminal.commandHistory.length, terminal.historyPosition + 1);
                input.value = terminal.commandHistory[terminal.historyPosition] || "";
            }
        });
    }

    /* ------------------------------------------------------------------
     * Dock open / close.
     * ------------------------------------------------------------------ */
    function setTerminalOpen(isOpen) {
        if (dockBody) {
            dockBody.hidden = !isOpen;
        }
        if (dockHeader) {
            dockHeader.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }
        var hintElement = dockHeader ? dockHeader.querySelector(".terminal-hint") : null;
        if (hintElement) {
            hintElement.textContent = isOpen ? "close" : "open";
        }
    }

    function toggleTerminal() {
        if (!dockBody) {
            return;
        }
        setTerminalOpen(dockBody.hidden);
        if (!dockBody.hidden) {
            input.focus();
        }
    }

    function wireDockToggle() {
        if (!dockHeader) {
            return;
        }
        dockHeader.addEventListener("click", toggleTerminal);
        dockHeader.addEventListener("keydown", function (keyEvent) {
            if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                keyEvent.preventDefault();
                toggleTerminal();
            }
        });
    }

    function printWelcomeMessage() {
        terminal.appendCommandEcho("help");
        terminal.typeSystemReplies([
            {text: "A glimpse into my journey so far. Try typing one of the available commands to dig deeper!", kind: "heading"},
            {text: "Available commands: origin, journey, now, hireme.", kind: "body"}
        ]);
    }

    /* ------------------------------------------------------------------
     * Boot.
     * ------------------------------------------------------------------ */
    wireInputHistory();
    wireDockToggle();
    setTerminalOpen(false);
    printWelcomeMessage();
})();
