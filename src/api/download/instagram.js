const axios = require("axios");
const cheerio = require("cheerio");

async function igexportDl(url) {
  if (!/instagram\.com/.test(url)) throw new Error("URL harus dari instagram.com");

  try {
    const { data } = await axios.post(
      "https://igexport.com/id/download",
      new URLSearchParams({ url }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": "https://igexport.com/id/"
        },
      }
    );

    if (!data || !data.html) throw new Error("Gagal mengambil data dari IGExport");

    const $ = cheerio.load(data.html);
    const media = [];

    // Mengambil semua link tombol download video/image
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

// Router Express
module.exports = function (app) {
  app.get("/download/instagram", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, error: "Url is required" });

    try {
      const result = await igexportDl(url);
      res.status(200).json({ status: true, creator: "zyro", result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
