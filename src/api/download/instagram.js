const axios = require("axios");

async function kolDl(url) {
  if (!/instagram\.com/.test(url)) {
    throw new Error("URL harus berasal dari instagram.com");
  }

  try {
    const { data } = await axios.post(
      "https://kol.id/api/download-instagram",
      { url },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Origin: "https://kol.id",
          Referer: "https://kol.id/download-video/instagram",
        },
      }
    );

    if (!data || !data.data) {
      throw new Error("Gagal mengambil data dari KOL.ID atau link privat");
    }

    return data.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Gagal memproses link Instagram"
    );
  }
}

module.exports = function (app) {
  app.get("/download/instagram", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ status: false, error: "Url parameter is required" });
    }

    try {
      const result = await kolDl(url);

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