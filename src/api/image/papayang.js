const axios = require("axios");

module.exports = function(app) {

    async function papAyang() {
        try {
            // Menggunakan database gambar alternatif yang aktif
            const { data } = await axios.get(
                "https://raw.githubusercontent.com/BagusSajiwo/database/main/papayang.json"
            );

            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error("Daftar gambar tidak ditemukan");
            }

            // Pilih random URL dari JSON baru
            const randomUrl = data[Math.floor(Math.random() * data.length)];

            // Ambil gambar sebagai buffer
            const response = await axios.get(randomUrl, { 
                responseType: "arraybuffer",
                timeout: 10000 
            });
            
            return Buffer.from(response.data);

        } catch (error) {
            throw error;
        }
    }

    app.get("/image/papayang", async (req, res) => {
        try {
            const buffer = await papAyang();
            res.writeHead(200, {
                "Content-Type": "image/jpeg",
                "Content-Length": buffer.length
            });
            res.end(buffer);
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "Zyro API",
                message: error.message
            });
        }
    });

};
