// Home: the three latest posts from Wix Blog. The section stays hidden when there are none or the read fails.
import { fetchPosts } from "/js/wix/posts.js";
import { fetchBlogCategories } from "/js/wix/taxonomy.js";
import { postCard } from "/js/cards.js";

const section = document.getElementById("latest-posts");
const grid = section && section.querySelector("[data-posts]");

if (grid) {
  Promise.all([fetchPosts({ limit: 3 }), fetchBlogCategories().catch(() => [])])
    .then(([page, categories]) => {
      if (!page.posts.length) return;
      const label = new Map(categories.map((c) => [c.id, c.label]));
      grid.innerHTML = page.posts.map((p) => postCard(p, label.get(p.categoryIds[0]))).join("");
      section.hidden = false;
    })
    .catch(() => {});
}
