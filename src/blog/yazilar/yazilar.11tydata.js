// Tüm blog yazıları için ortak ayarlar.
// Taslak (draft: true) işaretli yazılar yayınlanmaz ve hiçbir listede görünmez.
export default {
  layout: "layouts/post.njk",
  ogType: "article",
  navActive: "blog",
  eleventyComputed: {
    permalink: (data) => (data.draft ? false : `/blog/${data.page.fileSlug}/`),
    eleventyExcludeFromCollections: (data) => Boolean(data.draft),
  },
};
