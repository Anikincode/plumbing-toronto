// One blog post, read live from Wix Blog by its slug (post.html?slug=...).
import { createPostStore } from "/plumbing-toronto/js/wix/post-store.js";
import { esc, postCard, sized } from "/plumbing-toronto/js/cards.js";

const slug = new URLSearchParams(location.search).get("slug") || "";
const titleEl = document.querySelector("[data-post-title]");
const metaEl = document.querySelector("[data-post-meta]");
const catsEl = document.querySelector("[data-post-cats]");
const coverEl = document.querySelector("[data-post-cover]");
const bodyEl = document.querySelector("[data-post-body]");
const related = document.querySelector("[data-related]");
const relatedGrid = document.querySelector("[data-related-grid]");
const metaDesc = document.querySelector('meta[name="description"]');

const store = createPostStore({ slug });

function render(s) {
  if (s.notFound || (!slug && !s.post)) {
    document.title = "Post not found | Plumbing Toronto";
    titleEl.textContent = "This post does not exist";
    bodyEl.innerHTML = '<p>It may have been moved or unpublished. <a href="/plumbing-toronto/blog.html">See all posts</a>.</p>';
    return;
  }
  if (!s.post) {
    titleEl.textContent = s.error ? "The post could not be loaded" : "Loading post…";
    if (s.error) bodyEl.innerHTML = '<p>Please refresh the page, or <a href="/plumbing-toronto/blog.html">go back to the blog</a>.</p>';
    return;
  }
  const p = s.post;
  document.title = `${p.seoTitle || p.title} | Plumbing Toronto`;
  if (metaDesc && p.seoDescription) metaDesc.setAttribute("content", p.seoDescription.slice(0, 160));
  titleEl.textContent = p.title;
  catsEl.textContent = s.categories.map((c) => c.label).join(" · ");
  const bits = [];
  if (p.dateLabel) bits.push(`<time datetime="${esc(p.dateISO)}">${esc(p.dateLabel)}</time>`);
  if (p.minutesToRead) bits.push(`${p.minutesToRead} min read`);
  if (p.authorName) bits.push(`By ${esc(p.authorName)}`);
  metaEl.innerHTML = bits.join(" · ");
  if (p.coverUrl) {
    coverEl.innerHTML = `<img src="${esc(sized(p.coverUrl, 1200, 630))}" alt="${esc(p.coverAlt)}" width="1200" height="630">`;
    coverEl.hidden = false;
  }
  if (p.bodyHtml) bodyEl.innerHTML = p.bodyHtml;
  else bodyEl.replaceChildren(...p.paragraphs.map((t) => { const el = document.createElement("p"); el.textContent = t; return el; }));
  if (s.related && s.related.length) {
    relatedGrid.innerHTML = s.related.slice(0, 3).map((r) => postCard(r)).join("");
    related.hidden = false;
  }
}

store.subscribe(render);
render(store.getState());
store.start();
