const axios = require("axios");

async function kolDl(url) {
  if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(url)) {
    throw new Error("URL harus berasal dari instagram.com");
  }

  const { data } = await axios.post(
    "https://kol.id/api/download-instagram",
    { url },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Origin: "https://kol.id",
        Referer: "https://kol.id/download-video/instagram",
      },
      timeout: 20000,
    }
  );

  if (!data?.data) {
    throw new Error(
      data?.message || "Gagal mengambil data dari KOL.ID atau link privat"
    );
  }

  return data.data;
}

module.exports = (app) => {
  app.get("/download/instagram", async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "Url parameter is required",
        });
      }

      const result = await kolDl(url);

      return res.json({
        status: true,
        creator: "zyro",
        result,
      });
    } catch (err) {
      console.error(err.response?.data || err.message);

      return res.status(500).json({
        status: false,
        error:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal memproses link Instagram",
      });
    }
  });
};