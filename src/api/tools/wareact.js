const axios = require("axios");

async function sendWaReaction(waUrl, emojisInput) {
  try {
    const emoji = emojisInput ? emojisInput.split(",")[0].trim() : "😂";

    // Nembak API provider publik alternatif
    const { data } = await axios.get(`https://api.vreden.web.id/api/wareact?url=${encodeURIComponent(waUrl)}&emoji=${encodeURIComponent(emoji)}`, {
      timeout: 15000
    });

    if (!data || !data.result) {
      throw new Error("Gagal mengirim reaksi WhatsApp, pastikan link valid");
    }

    return data.result;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Gagal memproses reaksi WhatsApp"
    );
  }
}

module.exports = function (app) {
  app.get("/tools/wareact", async (req, res) => {
    const { url, emojis } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "zyro",
        error: "Url WhatsApp (url) is required"
      });
    }

    try {
      const result = await sendWaReaction(url, emojis);

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
