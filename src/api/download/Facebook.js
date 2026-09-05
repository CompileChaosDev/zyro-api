const axios = require("axios");
const cheerio = require("cheerio");

async function facebookDl(url) {
  try {
    if (!/^(https?:\/\/)?(www\.|m\.)?(facebook\.com|fb\.watch)\//i.test(url)) {
      throw new Error("URL harus berasal dari facebook.com atau fb.watch");
    }

    const params = new URLSearchParams();
    params.append("URLz", url);

    const response = await axios.post("https://fdown.net/download.php", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://fdown.net/",
        "Origin": "https://fdown.net"
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);

    const title =
      $(".lib-row .lib-header").text().trim() ||
      $(".lead").first().text().trim() ||
      "Facebook Video";

    const thumbnail =
      $(".lib-row img").attr("src") ||
      $("#result img").attr("src") ||
      null;

    const sdLink = $("#sdlink").attr("href");
    const hdLink = $("#hdlink").attr("href");

    const downloads = [];

    if (sdLink) {
      downloads.push({
        quality: "SD",
        url: sdLink
      });
    }

    if (hdLink) {
      downloads.push({
        quality: "HD",
        url: hdLink
      });
    }

    // Fallback jika ID #sdlink / #hdlink tidak ditemukan
    if (downloads.length === 0) {
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();

        if (href && href.startsWith("http") && !href.includes("fdown.net")) {
          if (/download/i.test(text) || /video/i.test(href)) {
            downloads.push({
              quality: /hd/i.test(text) ? "HD" : "SD",
              url: href
            });
          }
        }
      });
    }

    if (downloads.length === 0) {
      throw new Error("Video tidak ditemukan, bersifat privat, atau FDown gagal memproses link");
    }

    // Hapus duplicate link jika ada
    const uniqueDownloads = downloads.filter(
      (item, index, self) => index === self.findIndex((x) => x.url === item.url)
    );

    return {
      title,
      thumbnail,
      downloads: uniqueDownloads
    };
  } catch (error) {
    throw new Error(error.message || "Gagal mengambil data Facebook");
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