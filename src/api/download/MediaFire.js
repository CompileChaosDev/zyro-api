const axios = require("axios");
const cheerio = require("cheerio");

async function mediafireDl(url) {
  try {
    if (!/mediafire\.com/.test(url)) {
      throw new Error("URL harus berasal dari mediafire.com");
    }

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.data) throw new Error("Gagal mengambil halaman MediaFire");

    const $ = cheerio.load(response.data);
    const downloadUrl = $("#downloadButton").attr("href");
    const filename =
      $(".dl-info .filename").text().trim() ||
      $(".dl-btn-label").text().trim();
    const filesize = $(".dl-info .filesize span").text().trim();
    const ext = filename ? filename.split(".").pop() : "";

    if (!downloadUrl) {
      throw new Error("Link download tidak ditemukan atau file telah dihapus");
    }

    return {
      filename,
      filesize,
      ext,
      download_url: downloadUrl,
    };
  } catch (error) {
    throw new Error(error.message || "Gagal mengambil data MediaFire");
  }
}

module.exports = function (app) {
  app.get("/download/mediafire", async (req, res) => {
    const { url } = req.query;

    if (!url)
      return res.status(400).json({ status: false, error: "Url is required" });

    try {
      const result = await mediafireDl(url);

      res.status(200).json({
        status: true,
        result,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
