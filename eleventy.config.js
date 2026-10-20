import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const toDate = (value) => (value instanceof Date ? value : new Date(value));
const byDateDesc = (a, b) => b.date - a.date;
const isPublished = (item) => !item.data.draft;

export default function (eleventyConfig) {
  // --- Statik dosyalar ---------------------------------------------------
  eleventyConfig.addPassthroughCopy("src/gorseller");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy({
    "src/robots.txt": "robots.txt",
    "src/_redirects": "_redirects",
    "src/_headers": "_headers",
  });

  // --- Görsel optimizasyonu: tüm <img> etiketleri WebP + boyut bilgisiyle yeniden üretilir ---
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "auto"],
    widths: ["auto"],
    failOnError: false,
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async" },
    },
  });

  // Yazı içindeki markdown görselleri: duyarlı boyutlar
  eleventyConfig.amendLibrary("md", (md) => {
    const defaultImage = md.renderer.rules.image;
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      token.attrSet("eleventy:widths", "480,800,1200");
      token.attrSet("sizes", "(max-width: 848px) calc(100vw - 48px), 800px");
      return defaultImage(tokens, idx, options, env, self);
    };
  });

  // --- Koleksiyonlar -----------------------------------------------------
  eleventyConfig.addCollection("yazilar", (api) =>
    api.getFilteredByGlob("src/blog/yazilar/*.md").filter(isPublished).sort(byDateDesc)
  );
  eleventyConfig.addCollection("videolar", (api) =>
    api.getFilteredByGlob("src/videolar/*.md").filter(isPublished).sort(byDateDesc)
  );
  eleventyConfig.addCollection("akis", (api) =>
    api
      .getFilteredByGlob(["src/blog/yazilar/*.md", "src/videolar/*.md"])
      .filter(isPublished)
      .sort(byDateDesc)
  );

  // --- Filtreler ---------------------------------------------------------
  eleventyConfig.addFilter("trDate", (value) => {
    const d = toDate(value);
    return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("isoDate", (value) => toDate(value).toISOString().slice(0, 10));
  eleventyConfig.addFilter("rfcDate", (value) => toDate(value).toUTCString());

  eleventyConfig.addFilter("absUrl", (value, base) => {
    if (!value) return value;
    return /^https?:\/\//.test(value) ? value : new URL(value, base).href;
  });

  eleventyConfig.addFilter("readingTime", (html = "") => {
    const words = String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  });

  eleventyConfig.addFilter("youtubeId", (url = "") => {
    if (!url) return "";
    const match = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
    if (match) return match[1];
    return /^[A-Za-z0-9_-]{11}$/.test(url) ? url : "";
  });

  eleventyConfig.addFilter("findBy", (list = [], key, value) => list.find((item) => item[key] === value));
  eleventyConfig.addFilter("head", (items = [], n) => items.slice(0, n));
  eleventyConfig.addFilter("onlyPosts", (items = []) => items.filter((item) => !item.data.url));
  eleventyConfig.addFilter("whereCategory", (items = [], slug) => items.filter((item) => item.data.category === slug));
  eleventyConfig.addFilter("related", (items = [], current, limit = 3) =>
    items
      .filter((item) => item.url !== current.url && item.data.category === current.data.category)
      .slice(0, limit)
  );
  eleventyConfig.addFilter("excerpt", (html = "", length = 180) => {
    const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, "")}…` : text;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
