const axios = require("axios");

async function downloadIg(url) {
  try {
    const response = await axios({
      method: "POST",
      url: "https://igexport.com/api/video-downloader",
      data: { url: url },
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
        Origin: "https://igexport.com",
        Referer: "https://igexport.com/id/video-download/",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      timeout: 15000,
    });

    if (response.data && (response.data.url || response.data.download_url)) {
      return {
        url: response.data.url || response.data.download_url,
        thumbnail: response.data.thumbnail || response.data.cover || null,
      };
    }

    throw new Error("Gagal mengambil media dari Instagram.");
  } catch (err) {
    if (err.response?.status === 405) {
      throw new Error("Server website sumber memblokir request (405 Method Not Allowed).");
    }
    throw new Error(err.response?.data?.message || err.message || "Gagal memproses URL Instagram.");
  }
}

module.exports = function (app) {
  app.get("/download/instagram", async (req, res) => {
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
