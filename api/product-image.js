const TRUSTED_SUFFIXES = [
  "additel.com",
  "ametekcalibration.com",
  "fluke.com",
  "wika.com",
  "bakerhughes.com",
  "ashcroft.com",
  "keller-pressure.com",
  "omega.com",
  "media.fluke.com"
];

function trustedHost(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return TRUSTED_SUFFIXES.some(suffix => host === suffix || host.endsWith("." + suffix));
}

function safeRemoteUrl(value, requireTrusted = true) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host)
    ) return null;
    if (requireTrusted && !trustedHost(host)) return null;
    return url;
  } catch {
    return null;
  }
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function findImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try { return new URL(decodeHtml(match[1]), baseUrl); } catch {}
    }
  }

  const jsonImage = html.match(/"image"\s*:\s*(?:\[\s*)?["']([^"']+)["']/i);
  if (jsonImage?.[1]) {
    try { return new URL(decodeHtml(jsonImage[1]), baseUrl); } catch {}
  }
  return null;
}

async function fetchRemote(url, accept) {
  return fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MetrologyBase/1.0; +https://metrologybase.vercel.app)",
      "Accept": accept,
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
}

module.exports = async function handler(req, res) {
  try {
    const direct = safeRemoteUrl(req.query.image, true);
    const source = safeRemoteUrl(req.query.source, true);
    let imageUrl = direct;

    if (!imageUrl && source) {
      const page = await fetchRemote(source, "text/html,application/xhtml+xml");
      if (page.ok) {
        const type = page.headers.get("content-type") || "";
        if (type.includes("text/html")) {
          const html = await page.text();
          imageUrl = findImage(html, source);
        }
      }
    }

    if (!imageUrl) {
      res.status(404).json({ error: "No manufacturer image found" });
      return;
    }

    const image = await fetchRemote(imageUrl, "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8");
    if (!image.ok) {
      res.status(502).json({ error: "Manufacturer image request failed" });
      return;
    }

    const contentType = image.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      res.status(415).json({ error: "Upstream response was not an image" });
      return;
    }

    const length = Number(image.headers.get("content-length") || 0);
    if (length > 8_000_000) {
      res.status(413).json({ error: "Image too large" });
      return;
    }

    const body = Buffer.from(await image.arrayBuffer());
    if (body.length > 8_000_000) {
      res.status(413).json({ error: "Image too large" });
      return;
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(body);
  } catch {
    res.status(500).json({ error: "Unable to load manufacturer image" });
  }
};
