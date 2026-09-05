const axios = require("axios");
const crypto = require("crypto");

async function sendWaReaction(waUrl, emojisInput) {
  try {
    // Generate Device Fingerprint & Dummy Turnstile Token secara dinamis
    const deviceFingerprint = `DEV_${crypto.randomBytes(4).toString("hex")}`;
    const dummyTurnstile = `${crypto.randomBytes(2).toString("hex").toUpperCase()}.${crypto.randomBytes(4).toString("hex").toUpperCase()}.${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    // Format emoji
    let emojis = "😂,,,";
    if (emojisInput) {
      const parts = emojisInput.split(",");
      emojis = parts.map((r) => r.trim()).filter(Boolean).join(",");
      while (emojis.split(",").length < parts.length) emojis += ",";
    }

    const { data } = await axios.post(
      "https://keyyss-react.web.id/api/react",
      {
        url: waUrl,
        deviceFingerprint: deviceFingerprint,
        emojis: emojis,
        turnstileToken: dummyTurnstile,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Device-Fingerprint": deviceFingerprint,
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
          "Origin": "https://keyyss-react.web.id",
          "Referer": "https://keyyss-react.web.id/",
        },
        timeout: 15000,
      }
    );

    return {
      fingerprint: deviceFingerprint,
      emojis,
      data,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Gagal mengirim reaksi WhatsApp"
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
        error: "Url WhatsApp (url) is required",
      });
    }

    try {
      const result = await sendWaReaction(url, emojis);

      return res.status(200).json({
        status: true,
        creator: "zyro",
        result,
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
