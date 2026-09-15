const fs = require("fs/promises");
const path = require("path");

const MVX_CSS = `
:root {
  --bg-app: #050914;
  --bg-sidebar: #07111f;
  --bg-card: #0b1424;
  --bg-card-hover: #101d31;
  --border-color: rgba(45, 201, 247, 0.18);
  --primary: #2dc9f7;
  --primary-hover: #19b4e2;
}
.brand-icon {
  background: linear-gradient(135deg, #2dc9f7, #2563eb);
}
.sidebar {
  box-shadow: inset -1px 0 0 rgba(45, 201, 247, 0.06);
}
`;

function brandHtml(source) {
  return String(source)
    .replace("<title>AutoSocial Studio</title>", "<title>MVX Social — MVX Ads Master</title>")
    .replace('<div class="brand-icon">A</div>', '<div class="brand-icon">M</div>')
    .replace("<h1>AutoSocial</h1>", "<h1>MVX Social</h1>")
    .replace("</head>", '  <meta name="application-name" content="MVX Social" />\n  <meta name="theme-color" content="#050914" />\n</head>');
}

function brandCss(source) {
  return `${String(source).trimEnd()}\n\n/* MVX Ads Master branding overlay */\n${MVX_CSS}`;
}

function installMvxBranding(express) {
  if (!express || typeof express.static !== "function") {
    throw new TypeError("Express with static() is required");
  }
  if (express.static.__mvxBrandingInstalled) return;

  const originalStatic = express.static;
  function brandedStatic(root, options) {
    const serveOriginal = originalStatic(root, options);
    return async function mvxBrandingMiddleware(req, res, next) {
      try {
        const requestPath = String(req.path || req.url || "").split("?")[0];
        if (requestPath === "/" || requestPath === "/index.html") {
          const html = await fs.readFile(path.join(root, "index.html"), "utf8");
          res.type("html").send(brandHtml(html));
          return;
        }
        if (requestPath === "/style.css") {
          const css = await fs.readFile(path.join(root, "style.css"), "utf8");
          res.type("css").send(brandCss(css));
          return;
        }
      } catch (error) {
        next(error);
        return;
      }
      serveOriginal(req, res, next);
    };
  }
  brandedStatic.__mvxBrandingInstalled = true;
  express.static = brandedStatic;
}

module.exports = { MVX_CSS, brandHtml, brandCss, installMvxBranding };
