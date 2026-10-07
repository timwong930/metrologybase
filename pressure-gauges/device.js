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

  const isAdditel = sourceHost === "additel.com" || sourceHost.endsWith(".additel.com");
  const isWebsitePreview = /s\.wordpress\.com\/mshots/i.test(originalImage);
  const isVerifiedDirectProductImage = image.dataset.directProductImage === "true";

  // Explicit distributor/manufacturer product images should never be routed
  // through the extractor. Render the known-good asset directly.
  if (isVerifiedDirectProductImage) {
    frame.classList.add("media-ready");
    return;
  }

  // Leave verified direct manufacturer images alone.
  if (!isAdditel && !isWebsitePreview && originalImage) {
    frame.classList.add("media-ready");
    return;
  }

  const params = new URLSearchParams({ source: sourceUrl, model });
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