const axios = require("axios");

function clean(data = "") {
  if (typeof data !== "string") return "";
  return data
    .replace(/(<br?\s?\/>)/gi, "\n")
    .replace(/(<([^>]+)>)/gi, "");
}

async function shortener(url) {
  return url;
}

async function Tiktok(query) {
  const response = await axios("https://lovetik.com/api/ajax/search", {
    method: "POST",
    data: new URLSearchParams({ query }),
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "Mozilla/5.0"
    }
  });

  const res = response.data || {};

  return {
    title: clean(res.desc),
    author: clean(res.author),
    nowm: res.links?.[0]?.a
      ? shortener(res.links[0].a.replace("https", "http"))
      : null,
    watermark: res.links?.[1]?.a
      ? shortener(res.links[1].a.replace("https", "http"))
      : null,
    audio: res.links?.[2]?.a
      ? shortener(res.links[2].a.replace("https", "http"))
      : null,
    thumbnail: res.cover || null
  };
}

module.exports = { Tiktok };
