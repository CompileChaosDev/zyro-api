const axios = require("axios");
const FormData = require("form-data");

async function uploadCatbox(fileBuffer, originalname) {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fileBuffer, { filename: originalname || "file.jpg" });

    const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: {
        ...form.getHeaders(),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 60000,
    });

    if (typeof data === "string" && data.startsWith("https://files.catbox.moe/")) {
      return data.trim();
    }

    throw new Error("Gagal mengunggah file ke Catbox");
  } catch (error) {
    throw new Error(error.message || "Gagal memproses upload Catbox");
  }
}

module.exports = function (app) {
  app.post("/tools/catbox", async (req, res) => {
    try {
      let fileBuffer;
      let filename = "upload.jpg";
      let mimetype = "image/jpeg";
      let size = 0;

      // 1. Cek jika file dikirim via form file upload
      if (req.files && Object.keys(req.files).length > 0) {
        const uploadedFile = req.files.file || Object.values(req.files)[0];
        fileBuffer = uploadedFile.data;
        filename = uploadedFile.name;
        mimetype = uploadedFile.mimetype;
        size = uploadedFile.size;
      } 
      // 2. Cek jika dikirim via parameter Body / Query URL (?url=https://...)
      else if (req.body?.url || req.query?.url) {
        const targetUrl = req.body?.url || req.query?.url;
        const response = await axios.get(targetUrl, { responseType: "arraybuffer" });
        fileBuffer = Buffer.from(response.data);
        filename = targetUrl.split("/").pop().split("?")[0] || "file.jpg";
        mimetype = response.headers["content-type"] || "application/octet-stream";
        size = fileBuffer.length;
      } 
      else {
        return res.status(400).json({
          status: false,
          creator: "zyro",
          error: "File is required! Upload file via form 'file' atau masukkan parameter 'url'",
        });
      }

      const url = await uploadCatbox(fileBuffer, filename);

      return res.status(200).json({
        status: true,
        creator: "zyro",
        result: {
          filename,
          size,
          mimetype,
          url,
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
