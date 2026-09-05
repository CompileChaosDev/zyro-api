const Jimp = require("jimp");
const axios = require("axios");

const FRAME_URL = "https://files.clugx.my.id/ehmVW.png";

module.exports = function (app) {
  async function makeTwibbon(userPhotoBuffer) {
    try {
      const user = await Jimp.read(userPhotoBuffer);
      user.resize(1080, 1080);

      const frameResp = await axios.get(FRAME_URL, {
        responseType: "arraybuffer",
        timeout: 15000,
      });
      const frame = await Jimp.read(Buffer.from(frameResp.data));
      frame.resize(1080, 1080);

      user.composite(frame, 0, 0);

      const buffer = await user.getBufferAsync(Jimp.MIME_PNG);
      return buffer;
    } catch (error) {
      throw error;
    }
  }

  app.get("/image/mpls", async (req, res) => {
    const imageUrl = req.query.url;

    if (!imageUrl) {
      return res.status(400).json({
        status: false,
        creator: "zyro",
        message: "Parameter 'url' dibutuhkan",
      });
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
      });

      const buffer = await makeTwibbon(Buffer.from(response.data));

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", buffer.length);
      return res.end(buffer);
    } catch (error) {
      return res.status(500).json({
        status: false,
        creator: "zyro",
        message: "Gagal memproses gambar: " + error.message,
      });
    }
  });
};
