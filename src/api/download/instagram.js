const axios = require("axios");

async function downloadIg(url) {
  try {
    const response = await axios.post(
      "https://igexport.com/api/video-downloader",
      { url: url },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://igexport.com/id/video-download/",
        },
        timeout: 15000,
      }
    );

    if (response.data && response.data.url) {
      return {
        url: response.data.url,
        thumbnail: response.data.thumbnail || null,
      };
    }

    throw new Error("Gagal mengambil media dari Instagram.");
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Gagal memproses URL Instagram.");
  }
}

module.exports = function (app) {
  app.get("/downloader/ig", async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          status: false,
          creator: "zyro",
          error: "Parameter 'url' wajib diisi",
        });
      }

      const result = await downloadIg(url);

      return res.status(200).json({
        status: true,
        creator: "zyro",
        result: result,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        creator: "zyro",
        error: err.message,
      });
    }
  });
};
