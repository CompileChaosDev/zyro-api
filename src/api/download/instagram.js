const axios = require("axios");

async function fastdlDl(url) {
  if (!/instagram\.com/.test(url)) {
    throw new Error("URL harus berasal dari instagram.com");
  }

  try {
    // 1. Kirim request HTTP POST ke endpoint internal FastDL
    const response = await axios.post(
      "https://fastdl.app/api/convert",
      { url: url },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Origin: "https://fastdl.app",
          Referer: "https://fastdl.app/",
        },
      }
    );

    const data = response.data;

    // 2. Parsing hasil JSON
    if (data?.url && Array.isArray(data.url) && data.url.length > 0) {
      const bestVideo = data.url.reduce((prev, curr) =>
        (curr.quality || 0) > (prev.quality || 0) ? curr : prev
      );

      return {
        original_url: url,
        title: data.meta?.title || "Untitled",
        username: data.meta?.username || "unknown",
        shortcode: data.meta?.shortcode || "",
        thumbnail: data.meta?.thumbnail || null,
        download_url: bestVideo.url,
        quality: bestVideo.subname || `${bestVideo.quality}p`,
        type: bestVideo.type || bestVideo.ext || "mp4",
        all_qualities: data.url,
      };
    }

    throw new Error("Media tidak ditemukan atau postingan bersifat privat");
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Gagal mengambil data dari FastDL");
  }
}

// Router untuk Express.js kamu
module.exports = function (app) {
  app.get("/download/instagram", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ status: false, error: "Url parameter is required" });
    }

    try {
      const result = await fastdlDl(url);
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