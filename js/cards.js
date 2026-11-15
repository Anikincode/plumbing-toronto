// Shared helpers for the blog cards (home, blog, post pages).
export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

// Wix Media URLs come at full size (some covers are 4 MB PNGs); ask Wix for a sized copy.
export function sized(url, w, h) {
  if (!url) return "";
  const m = /^https:\/\/static\.wixstatic\.com\/media\/([^/?#]+)$/.exec(url);
  return m ? `${url}/v1/fill/w_${w},h_${h},al_c,q_80,enc_auto/cover.jpg` : url;
}

export function postHref(slug) {
  return "/plumbing-toronto/post.html?slug=" + encodeURIComponent(slug);
}

export function postCard(p, categoryLabel) {
  const cover = p.coverUrl
    ? `<img src="${esc(sized(p.coverUrl, 640, 360))}" alt="${esc(p.coverAlt)}" width="640" height="360" loading="lazy" decoding="async">`
    : "";
  const cat = categoryLabel ? `<span class="post-card-cat">${esc(categoryLabel)}</span>` : "";
  const date = p.dateLabel ? `<time datetime="${esc(p.dateISO)}">${esc(p.dateLabel)}</time>` : "";
  const excerpt = p.excerpt ? `<p>${esc(p.excerpt.length > 160 ? p.excerpt.slice(0, 157).trimEnd() + "…" : p.excerpt)}</p>` : "";
  return `<a class="post-card" href="${postHref(p.slug)}">${cover}<div class="post-card-body">${cat}<h3>${esc(p.title)}</h3>${excerpt}${date}</div></a>`;
}
