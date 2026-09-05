const axios = require("axios");
const cheerio = require("cheerio");

async function instagramDl(url) {
  try {
    if (!/instagram\.com/.test(url)) {
      throw new Error("URL harus berasal dari instagram.com");
    }

    
    const response = await axios.post(
      "https://v3.viddown.net/api/ajaxSearch",
      new URLSearchParams({ q: url, vt: "instagram" }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      }
    );

    const $ = cheerio.load(response.data.data);
    const media = [];

    $(".download-items").each((_, el) => {
      const downloadUrl = $(el).find(".download-items__btn a").attr("href");
      const thumbnail = $(el).find(".download-items__thumb img").attr("src");
      const type = downloadUrl?.includes(".mp4") ? "video" : "image";

      if (downloadUrl) {
        media.push({
          type,
          thumbnail: thumbnail || null,
          url: downloadUrl,
        });
      }
    });

    if (media.length === 0) {
      throw new Error("Media tidak ditemukan atau akun bersifat privat");
    }

    return media;
  } catch (error) {
    throw new Error(error.message || "Gagal mengambil data Instagram");
  }
}


module.exports = function (app) {
  app.get("/download/instagram", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ status: false, error: "Url is required" });
    }

    try {
      const result = await instagramDl(url);
      res.status(200).json({
        status: true,
        creator: "zyro",
        result,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
