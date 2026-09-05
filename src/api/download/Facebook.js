const axios = require("axios");
const cheerio = require("cheerio");

async function facebookDl(url) {
  try {
    if (!/facebook\.com|fb\.watch/.test(url)) {
      throw new Error("URL harus berasal dari facebook.com atau fb.watch");
    }

    const response = await axios.post(
      "https://getmyfb.com/process",
      new URLSearchParams({ id: url, locale: "en" }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const $ = cheerio.load(response.data);
    const title = $(".results-item-text").text().trim() || "Facebook Video";
    const thumbnail = $(".results-item-image").attr("src") || null;
    const urls = [];

    $(".results-list-item").each((_, el) => {
      const quality = $(el).text().includes("HD") ? "HD" : "SD";
      const downloadUrl = $(el).find("a").attr("href");

      if (downloadUrl && !downloadUrl.startsWith("javascript")) {
        urls.push({
          quality,
          url: downloadUrl,
        });
      }
    });

    if (urls.length === 0) {
      throw new Error("Video tidak ditemukan atau bersifat privat");
    }

    return {
      title,
      thumbnail,
      downloads: urls,
    };
  } catch (error) {
    throw new Error(error.message || "Gagal mengambil data Facebook");
  }
}


module.exports = function (app) {
  app.get("/download/facebook", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ status: false, error: "Url is required" });
    }

    try {
      const result = await facebookDl(url);
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
