const axios = require("axios");
const cheerio = require("cheerio");

async function facebookDl(url) {
  try {
    if (!/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\//i.test(url)) {
      throw new Error("URL harus berasal dari facebook.com atau fb.watch");
    }

    const response = await axios.post(
      "https://fdown.net/download.php",
      new URLSearchParams({
        URLz: url
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://fdown.net/",
          "Origin": "https://fdown.net"
        },
        timeout: 30000,
        maxRedirects: 5
      }
    );

    const $ = cheerio.load(response.data);

    const title =
      $("h3").first().text().trim() ||
      $("title").text().trim() ||
      "Facebook Video";

    const thumbnail =
      $(".thumbnail img").attr("src") ||
      $("img").first().attr("src") ||
      null;

    const downloads = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();

      if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
        return;
      }

      if (
        /download/i.test(text) &&
        /https?:\/\//i.test(href)
      ) {
        let quality = "SD";

        if (/hd|high/i.test(text)) {
          quality = "HD";
        }

        downloads.push({
          quality,
          url: href
        });
      }
    });

    const unique = downloads.filter(
      (item, index, self) =>
        index === self.findIndex((x) => x.url === item.url)
    );

    if (unique.length === 0) {
      throw new Error(
        "Video tidak ditemukan, privat, atau FDown gagal memproses link"
      );
    }

    return {
      title,
      thumbnail,
      downloads: unique
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "Gagal mengambil data Facebook"
    );
  }
}

module.exports = function (app) {
  app.get("/download/facebook", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "zyro",
        error: "Url is required"
      });
    }

    try {
      const result = await facebookDl(url);

      return res.status(200).json({
        status: true,
        creator: "zyro",
        result
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        creator: "zyro",
        error: err.message
      });
    }
  });
};