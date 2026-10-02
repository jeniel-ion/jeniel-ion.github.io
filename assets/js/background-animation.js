/**
 * Background Animation — subtle hexadecimal rain on canvas.
 * Production rules: throttled on mobile, disabled on reduced motion,
 * self-removes on any error so content always renders.
 */
(function initializeBackgroundAnimation() {
    "use strict";
    var canvasElement = document.getElementById("backgroundCanvas");
    if (!canvasElement) {
        return;
    }
    try {
        var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) {
            canvasElement.remove();
            return;
        }
        var drawingContext = canvasElement.getContext("2d");
        var isSmallScreen = window.innerWidth < 760;
        var frameIntervalMilliseconds = isSmallScreen ? 140 : 80;
        var columnWidthPixels = 22;
        var columnDrops = [];
        var glyphCharacters = "0123456789abcdef$#*/{}";

        function resizeCanvasToViewport() {
            canvasElement.width = window.innerWidth;
            canvasElement.height = window.innerHeight;
            var columnCount = Math.floor(canvasElement.width / columnWidthPixels);
            columnDrops = [];
            for (var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                columnDrops.push(Math.random() * -40);
            }
        }

        resizeCanvasToViewport();
        window.addEventListener("resize", resizeCanvasToViewport);

        function readAccentColor() {
            var accent = getComputedStyle(document.body).getPropertyValue("--primary-accent");
            return accent ? accent.trim() : "#00e665";
        }

        window.setInterval(function renderAnimationFrame() {
            if (document.hidden) {
                return;
            }
            drawingContext.fillStyle = "rgba(4, 11, 7, 0.14)";
            drawingContext.fillRect(0, 0, canvasElement.width, canvasElement.height);
            drawingContext.fillStyle = readAccentColor();
            drawingContext.font = "13px monospace";
            for (var columnIndex = 0; columnIndex < columnDrops.length; columnIndex++) {
                var glyph = glyphCharacters.charAt(Math.floor(Math.random() * glyphCharacters.length));
                var horizontalPosition = columnIndex * columnWidthPixels;
                var verticalPosition = columnDrops[columnIndex] * 18;
                drawingContext.fillText(glyph, horizontalPosition, verticalPosition);
                if (verticalPosition > canvasElement.height && Math.random() > 0.976) {
                    columnDrops[columnIndex] = 0;
                }
                columnDrops[columnIndex] = columnDrops[columnIndex] + 1;
            }
        }, frameIntervalMilliseconds);
    } catch (backgroundError) {
        if (canvasElement && canvasElement.remove) {
            canvasElement.remove();
        }
    }
})();
