const axios = require("axios");
const FormData = require("form-data");

async function uploadCatbox(fileBuffer, originalname) {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fileBuffer, { filename: originalname });

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
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          status: false,
          creator: "zyro",
          error: "File is required (field name: 'file')",
        });
      }

      // Ambil file dari field 'file' atau file pertama yang diupload
      const uploadedFile = req.files.file || Object.values(req.files)[0];
      const url = await uploadCatbox(uploadedFile.data, uploadedFile.name);

      return res.status(200).json({
        status: true,
        creator: "zyro",
        result: {
          filename: uploadedFile.name,
          size: uploadedFile.size,
          mimetype: uploadedFile.mimetype,
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
