/**
 * Local dev server with GitHub Pages parity.
 *
 * Why this exists: `python -m http.server` always returns its own generic
 * "File not found" page for missing paths and cannot serve 404.html.
 * GitHub Pages automatically serves /404.html with a 404 status for any
 * unknown path — this script reproduces exactly that behavior locally.
 *
 * Usage: node dev-server.js   [http://localhost:8000]
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 8000;

const CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".webmanifest": "application/manifest+json",
    ".txt": "text/plain; charset=utf-8",
    ".pdf": "application/pdf"
};

function serve404(res) {
    fs.readFile(path.join(ROOT, "404.html"), function (error, data) {
        if (error) {
            res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
            res.end("404 - Not Found");
            return;
        }
        res.writeHead(404, {"Content-Type": "text/html; charset=utf-8"});
        res.end(data);
    });
}

const server = http.createServer(function (request, response) {
    let urlPath;
    try {
        urlPath = decodeURIComponent(request.url.split("?")[0]);
    } catch (decodeError) {
        urlPath = request.url.split("?")[0];
    }

    // Normalizing an absolute path keeps it inside the root ("/../x" -> "/x").
    const normalized = path.posix.normalize(urlPath.replace(/\\/g, "/"));
    const filePath = path.join(ROOT, normalized);

    if (!filePath.startsWith(ROOT)) {
        serve404(response);
        return;
    }

    fs.stat(filePath, function (statError, stats) {
        const target = !statError && stats.isDirectory()
            ? path.join(filePath, "index.html")
            : filePath;

        fs.readFile(target, function (readError, data) {
            if (readError) {
                serve404(response);
                return;
            }
            const type = CONTENT_TYPES[path.extname(target).toLowerCase()] || "application/octet-stream";
            response.writeHead(200, {"Content-Type": type});
            response.end(data);
        });
    });
});

server.listen(PORT, function () {
    console.log("Serving " + ROOT);
    console.log("Local:        http://localhost:" + PORT);
    console.log("Custom 404:   enabled (GitHub Pages parity)");
});
