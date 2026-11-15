// Blog listing on the Wix Blog feed store: topic filter, cards, load more.
import { createBlogFeedStore } from "/js/wix/blog-feed-store.js";
import { esc, postCard } from "/js/cards.js";

const chips = document.querySelector("[data-categories]");
const status = document.querySelector("[data-status]");
const grid = document.querySelector("[data-feed]");
const more = document.querySelector("[data-more]");

const feed = createBlogFeedStore();

function render(s) {
  const cats = s.categories.filter((c) => c.postCount > 0);
  chips.innerHTML = cats.length
    ? `<button type="button" data-cat="" aria-pressed="${s.activeCategoryId ? "false" : "true"}">All posts</button>` +
      cats.map((c) => `<button type="button" data-cat="${esc(c.id)}" aria-pressed="${s.activeCategoryId === c.id}">${esc(c.label)}</button>`).join("")
    : "";
  const label = new Map(s.categories.map((c) => [c.id, c.label]));
  if (s.posts === null) {
    status.textContent = "Loading posts…";
    grid.innerHTML = "";
  } else {
    status.textContent = s.error ? "The posts could not be loaded. Please refresh the page." : s.posts.length ? "" : "No posts yet.";
    grid.innerHTML = s.posts.map((p) => postCard(p, label.get(p.categoryIds[0]))).join("");
  }
  status.hidden = !status.textContent;
  more.hidden = !s.hasMore;
  more.disabled = s.loadingMore;
  more.setAttribute("aria-busy", String(s.loadingMore));
}

chips.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-cat]");
  if (b) feed.setActiveCategoryId(b.dataset.cat || null);
});
more.addEventListener("click", () => { feed.loadMore().catch(() => {}); });

feed.subscribe(render);
render(feed.getState());
feed.start();
