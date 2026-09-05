const axios = require("axios");
const FormData = require("form-data");

async function uploadToCatbox(fileBuffer, fileName = "file.jpg") {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", fileBuffer, { filename: fileName });

  const result = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: {
      ...form.getHeaders(),
    },
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const url = String(result.data || "").trim();

  if (!url || !/^https?:\/\/.+/i.test(url)) {
    throw new Error("Catbox tidak mengembalikan URL yang valid.");
  }

  return url;
}

module.exports = function (app) {
  app.all("/tools/catbox", async (req, res) => {
    try {
      let fileBuffer = null;
      let fileName = `file_${Date.now()}.jpg`;
      let mimetype = "image/jpeg";

      // 1. Ambil dari File Upload (Swagger / Postman)
      if (req.files && Object.keys(req.files).length > 0) {
        const uploadedFile = req.files.file || Object.values(req.files)[0];
        fileBuffer = uploadedFile.data;
        fileName = uploadedFile.name;
        mimetype = uploadedFile.mimetype;
      }
      // 2. Ambil dari Query/Body URL (Persis seperti bot Telegram)
      else if (req.query?.url || req.body?.url) {
        const targetUrl = req.query?.url || req.body?.url;
        const response = await axios.get(targetUrl, {
          responseType: "arraybuffer",
          timeout: 60000,
        });

        fileBuffer = Buffer.from(response.data);
        fileName = targetUrl.split("/").pop().split("?")[0] || `file_${Date.now()}.jpg`;
        mimetype = response.headers["content-type"] || "image/jpeg";
      }

      if (!fileBuffer) {
        return res.status(400).json({
          status: false,
          creator: "zyro",
          error: "Sediakan file via form 'file' atau gunakan parameter '?url='",
        });
      }

      const url = await uploadToCatbox(fileBuffer, fileName);

      return res.status(200).json({
        status: true,
        creator: "zyro",
        result: {
          filename: fileName,
          size: fileBuffer.length,
          mimetype: mimetype,
          url: url,
        },
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
