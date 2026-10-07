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
  return TRUSTED_SUFFIXES.some(function (suffix) {
    return host === suffix || host.endsWith("." + suffix);
  });
}

function safeRemoteUrl(value, requireTrusted) {
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
    if (requireTrusted !== false && !trustedHost(host)) return null;
    return url;
  } catch (error) {
    return null;
  }
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getAttr(tag, name) {
  const pattern = new RegExp(name + "\\s*=\\s*[\\"']([^\\"']+)[\\"']", "i");
  const match = tag.match(pattern);
  return match && match[1] ? decodeHtml(match[1]) : "";
}

function getModelTokens(model) {
  return String(model || "")
    .toLowerCase()
    .replace(/adt/g, " ")
    .split(/[^a-z0-9]+/)
    .filter(function (token) { return token.length >= 2; });
}

function candidateScore(url, context, model) {
  const text = (url.href + " " + String(context || "")).toLowerCase();
  let score = 0;

  const positives = [
    ["product", 40],
    ["pressure", 18],
    ["gauge", 30],
    ["digital", 10],
    ["gallery", 18],
    ["zoom", 18],
    ["large", 10],
    ["detail", 10],
    ["main", 8]
  ];
  const negatives = [
    ["logo", -140],
    ["icon", -100],
    ["favicon", -140],
    ["banner", -70],
    ["video", -55],
    ["youtube", -70],
    ["flag", -90],
    ["social", -55],
    ["facebook", -70],
    ["linkedin", -70],
    ["instagram", -70],
    ["avatar", -80],
    ["sprite", -90],
    ["arrow", -70],
    ["loading", -90],
    ["placeholder", -90],
    ["certificate", -45],
    ["datasheet", -30]
  ];

  positives.forEach(function (item) {
    if (text.includes(item[0])) score += item[1];
  });
  negatives.forEach(function (item) {
    if (text.includes(item[0])) score += item[1];
  });
  getModelTokens(model).forEach(function (token) {
    if (text.includes(token)) score += 100;
  });

  if (/\.(?:jpe?g|png|webp)(?:$|\?)/i.test(url.href)) score += 15;
  if (/thumb|small/i.test(text)) score -= 15;
  return score;
}

function addCandidate(list, seen, raw, context, model, baseUrl, bonus) {
  if (!raw || String(raw).startsWith("data:")) return;
  try {
    const url = new URL(decodeHtml(raw), baseUrl);
    if (url.protocol !== "https:" || !trustedHost(url.hostname) || seen.has(url.href)) return;
    seen.add(url.href);
    list.push({
      url: url,
      score: candidateScore(url, context, model) + (bonus || 0)
    });
  } catch (error) {}
}

function findImage(html, baseUrl, model) {
  const candidates = [];
  const seen = new Set();

  const metaPatterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/ig,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/ig
  ];
  metaPatterns.forEach(function (pattern) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      addCandidate(candidates, seen, match[1], "social metadata", model, baseUrl, 10);
    }
  });

  const jsonPattern = /"image"\s*:\s*(?:\[\s*)?["']([^"']+)["']/ig;
  let jsonMatch;
  while ((jsonMatch = jsonPattern.exec(html)) !== null) {
    addCandidate(candidates, seen, jsonMatch[1], "structured product image", model, baseUrl, 25);
  }

  const imgPattern = /<img\b[^>]*>/ig;
  let imgMatch;
  while ((imgMatch = imgPattern.exec(html)) !== null) {
    const tag = imgMatch[0];
    const context = [
      getAttr(tag, "alt"),
      getAttr(tag, "title"),
      getAttr(tag, "class"),
      getAttr(tag, "id")
    ].join(" ");

    ["src", "data-src", "data-original", "data-lazy-src", "data-image", "data-zoom-image"].forEach(function (name) {
      addCandidate(candidates, seen, getAttr(tag, name), context, model, baseUrl, name === "data-zoom-image" ? 20 : 0);
    });

    const srcset = getAttr(tag, "srcset") || getAttr(tag, "data-srcset");
    if (srcset) {
      const choices = srcset.split(",").map(function (part) {
        return part.trim().split(/\s+/)[0];
      }).filter(Boolean);
      if (choices.length) addCandidate(candidates, seen, choices[choices.length - 1], context, model, baseUrl, 8);
    }
  }

  candidates.sort(function (a, b) { return b.score - a.score; });
  if (!candidates.length) return null;

  if (baseUrl.hostname.toLowerCase().includes("additel.com")) {
    const strong = candidates.find(function (candidate) { return candidate.score >= 45; });
    return strong ? strong.url : null;
  }

  return candidates[0].url;
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
    const model = String(req.query.model || "").slice(0, 80);
    let imageUrl = direct;

    if (!imageUrl && source) {
      const page = await fetchRemote(source, "text/html,application/xhtml+xml");
      if (page.ok) {
        const type = page.headers.get("content-type") || "";
        if (type.includes("text/html")) {
          const html = await page.text();
          imageUrl = findImage(html, source, model);
        }
      }
    }

    if (!imageUrl) {
      res.status(404).json({ error: "No manufacturer product image found" });
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
    if (length > 8000000) {
      res.status(413).json({ error: "Image too large" });
      return;
    }

    const body = Buffer.from(await image.arrayBuffer());
    if (body.length > 8000000) {
      res.status(413).json({ error: "Image too large" });
      return;
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(body);
  } catch (error) {
    res.status(500).json({ error: "Unable to load manufacturer image" });
  }
};
