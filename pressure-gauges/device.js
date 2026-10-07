(() => {
  const frame = document.querySelector(".media-frame");
  const image = frame?.querySelector("img");
  const caption = document.querySelector(".media-caption");
  const sourceLink = document.querySelector(".source-actions .primary");
  const model = document.querySelector(".device-hero h1")?.textContent?.trim() || "";
  if (!frame || !image || !sourceLink) return;

  const originalImage = image.getAttribute("src") || "";
  const sourceUrl = sourceLink.getAttribute("href") || "";
  let sourceHost = "";
  try {
    sourceHost = new URL(sourceUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {}

  const params = new URLSearchParams({ source: sourceUrl, model });
  const isWebsitePreview = /s\.wordpress\.com\/mshots/i.test(originalImage);
  const isAdditel = sourceHost === "additel.com" || sourceHost.endsWith(".additel.com");

  // Additel pages should always resolve the real device image from Additel's page.
  // Never pass a screenshot/live-page preview as an image candidate.
  if (!isWebsitePreview && !isAdditel && originalImage.startsWith("https://")) {
    params.set("image", originalImage);
  }

  const proxied = "/api/product-image?" + params.toString();

  frame.classList.add("media-loading");
  image.removeAttribute("src");
  image.removeAttribute("srcset");
  image.removeAttribute("referrerpolicy");

  image.addEventListener("load", () => {
    frame.classList.remove("media-loading");
    frame.classList.add("media-ready");
    if (caption) {
      caption.textContent = "Product image sourced from the official manufacturer page. Appearance can vary by range or ordered configuration.";
    }
  }, { once: true });

  image.addEventListener("error", () => {
    frame.classList.remove("media-loading");
    frame.classList.add("media-fallback");
    image.remove();

    if (caption) {
      caption.textContent = "The manufacturer did not expose a usable product image for this page.";
    }

    const fallback = document.createElement("div");
    fallback.className = "media-fallback-card";
    fallback.innerHTML =
      '<span class="media-fallback-label">Product image unavailable</span>' +
      '<strong>View the official product gallery</strong>' +
      '<a href="' + sourceUrl.replace(/"/g, "&quot;") + '" target="_blank" rel="noopener">Open manufacturer page ↗</a>';
    frame.appendChild(fallback);
  }, { once: true });

  image.src = proxied;
})();