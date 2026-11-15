// Declarations of taxonomy-core.ts: what this file exports, their arguments and what they return.
// import type { BlogCategory, BlogTag } from "./blog-types.js";
// import type { ImgSrc, Raw } from "./posts-core.js";
// export declare const CATEGORY_SORT: readonly [{
//     readonly fieldName: "displayPosition";
//     readonly order: "ASC";
// }];
// export declare const TAG_SORT: readonly [{
//     readonly fieldName: "publishedPostCount";
//     readonly order: "DESC";
// }];
// export declare const TAXONOMY_LIMIT = 100;
// export declare const TAG_BY_IDS_LIMIT = 30;
// export declare const RECENT_POSTS_LIMIT = 100;
// export interface FetchCategoriesOptions {
//     withPosts?: boolean;
// }
// export declare function categoriesQuery(): Raw;
// export declare function recentPostsQuery(): Raw;
// export declare function withPostCounts(categories: BlogCategory[], recentPosts: Raw[], { withPosts }?: FetchCategoriesOptions): BlogCategory[];
// export declare function tagsByIdsQuery(ids: string[]): Raw;
// export declare function inIdOrder<T extends {
//     id: string;
// }>(ids: readonly string[], items: readonly T[]): T[];
// export declare function toCategory(raw: Raw, imgSrc: ImgSrc): BlogCategory;
// export declare function toTag(raw: Raw): BlogTag;
/** Menu order — displayPosition ascending; -1 (unplaced) sorts first, which is also what the SDK path shows. */
export const CATEGORY_SORT = [{ fieldName: "displayPosition", order: "ASC" }];
/** Most-published-posts first. */
export const TAG_SORT = [{ fieldName: "publishedPostCount", order: "DESC" }];
/** Blog taxonomies are small — one read of up to 100 is the whole list. */
export const TAXONOMY_LIMIT = 100;
/** A post carries at most 30 tag ids (the API's own cap), so one by-id read answers a post in full. */
export const TAG_BY_IDS_LIMIT = 30;
/**
 * The latest posts read next to the categories. A category's `postCount` is recounted by Wix after each
 * publish and can stay short of the real number when posts are published close together (0 for a
 * category that has posts), so the counts are checked against the posts themselves.
 */
export const RECENT_POSTS_LIMIT = 100;
const rawId = (raw) => raw?._id ?? raw?.id ?? "";
// A copy of posts-core's mediaValue: the REST Image object → the wix:image form imgSrc scales.
function mediaValue(value) {
    if (!value)
        return "";
    if (typeof value === "string")
        return value;
    const o = value;
    if (o.id && !String(o.id).startsWith("http")) {
        const size = o.width && o.height ? `#originWidth=${o.width}&originHeight=${o.height}` : "";
        return `wix:image://v1/${o.id}/${o.filename ?? ""}${size}`;
    }
    return o.url ?? o.image ?? "";
}
/** The categories query (REST body's `query`); the SDK spells it .ascending("displayPosition").limit(100). */
export function categoriesQuery() {
    return { sort: CATEGORY_SORT, paging: { limit: TAXONOMY_LIMIT } };
}
/** The latest posts' query (REST body's `query`; the SDK spells it .descending("firstPublishedDate").limit(100)). Base fields carry `categoryIds`. */
export function recentPostsQuery() {
    return { sort: [{ fieldName: "firstPublishedDate", order: "DESC" }], cursorPaging: { limit: RECENT_POSTS_LIMIT } };
}
/**
 * Each category's postCount raised to the number of the latest posts that carry it, then, with
 * `withPosts`, the categories that have none dropped. Wix's count can only be short here, never the
 * posts: a category that a recent post carries has posts.
 */
export function withPostCounts(categories, recentPosts, { withPosts = false } = {}) {
    const seen = new Map();
    for (const post of recentPosts)
        for (const id of (post.categoryIds ?? []))
            seen.set(id, (seen.get(id) ?? 0) + 1);
    const counted = categories.map((c) => ((seen.get(c.id) ?? 0) > c.postCount ? { ...c, postCount: seen.get(c.id) } : c));
    return withPosts ? counted.filter((c) => c.postCount > 0) : counted;
}
/**
 * Tags BY ID (REST body's `query`; the SDK spells it .in("_id", ids).limit(30)) — a post's chips are
 * read this way, not joined off a top-100 catalog: a blog's tags run to hundreds, and a tag past the
 * first page would silently lose its chip. Categories run to tens, so their catalog is joined in memory.
 */
export function tagsByIdsQuery(ids) {
    return { filter: { id: { $in: ids } }, paging: { limit: TAG_BY_IDS_LIMIT } };
}
/**
 * Items in the order the POST lists them (its `categoryIds`/`tagIds`), ids that resolved to nothing
 * dropped — the catalog's displayPosition and the query's own order are not the post's order.
 */
export function inIdOrder(ids, items) {
    const byId = new Map(items.map((x) => [x.id, x]));
    return ids.map((id) => byId.get(id)).filter((x) => x !== undefined);
}
export function toCategory(raw, imgSrc) {
    return {
        id: rawId(raw),
        slug: raw.slug ?? "",
        label: raw.label ?? "", // the API's display name is `label`, never `name`
        title: raw.title ?? "", // the category's SEO title (the dashboard's "title tag"); "" until the owner sets one
        description: raw.description ?? "",
        postCount: raw.postCount ?? 0, // Wix's count, which can be short: the fetchers correct it from the posts (withPostCounts)
        coverUrl: imgSrc(mediaValue(raw.coverImage), 1200, 675),
    };
}
export function toTag(raw) {
    return {
        id: rawId(raw),
        slug: raw.slug ?? "",
        label: raw.label ?? "",
        postCount: raw.publishedPostCount ?? 0, // PUBLISHED posts — postCount also counts drafts
    };
}
