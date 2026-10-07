(() => {
  const frame = document.querySelector(".media-frame");
  const image = frame?.querySelector("img");
  const sourceLink = document.querySelector(".source-actions .primary");
  if (!frame || !image || !sourceLink) return;

  const originalImage = image.getAttribute("src") || "";
  const sourceUrl = sourceLink.getAttribute("href") || "";
  const proxied = "/api/product-image?image=" + encodeURIComponent(originalImage) + "&source=" + encodeURIComponent(sourceUrl);

  frame.classList.add("media-loading");
  image.addEventListener("load", () => {
    frame.classList.remove("media-loading");
    frame.classList.add("media-ready");
  }, { once: true });

  image.addEventListener("error", () => {
    frame.classList.remove("media-loading");
    frame.classList.add("media-fallback");
    image.remove();

    const fallback = document.createElement("div");
    fallback.className = "media-fallback-card";
    fallback.innerHTML =
      '<span class="media-fallback-label">Manufacturer image unavailable</span>' +
      '<strong>View the official product gallery</strong>' +
      '<a href="' + sourceUrl.replace(/"/g, "&quot;") + '" target="_blank" rel="noopener">Open manufacturer page ↗</a>';
    frame.appendChild(fallback);
  }, { once: true });

  image.removeAttribute("referrerpolicy");
  image.src = proxied;
})();