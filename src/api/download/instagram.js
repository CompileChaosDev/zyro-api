const axios = require("axios");
const cheerio = require("cheerio");

async function igexportDl(url) {
  if (!/instagram\.com/.test(url)) throw new Error("URL harus dari instagram.com");

  try {
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    
    // 1. Ambil session/cookie awal dari halaman utama
    const initPage = await axios.get("https://igexport.com/id/", {
      headers: { "User-Agent": userAgent }
    });

    const cookies = initPage.headers["set-cookie"]?.join("; ") || "";

    // 2. Tembak request POST membawa cookie
    const { data } = await axios.post(
      "https://igexport.com/id/download",
      new URLSearchParams({ url }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": userAgent,
          "X-Requested-With": "XMLHttpRequest",
          "Referer": "https://igexport.com/id/",
          "Cookie": cookies
        },
      }
    );

    if (!data || !data.html) throw new Error("Gagal mengambil data dari IGExport");

    const $ = cheerio.load(data.html);
    const media = [];

    $("a[href*='download']").each((_, el) => {
      const link = $(el).attr("href");
      if (link && !media.includes(link)) {
        media.push(link);
      }
    });

    if (media.length === 0) throw new Error("Media tidak ditemukan atau postingan privat");

    return media.map((downloadUrl) => ({
      type: downloadUrl.includes(".mp4") ? "video" : "image",
      url: downloadUrl
    }));
  } catch (err) {
    throw new Error(err.message || "Gagal memproses link IGExport");
  }
}
