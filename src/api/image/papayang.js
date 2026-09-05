const axios = require("axios");

module.exports = function(app) {

    async function papAyang() {
        try {
            const { data } = await axios.get(
                "https://raw.githubusercontent.com/mamixx15/papayang/refs/heads/main/pap-ayang.json"
            );

            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error("Daftar gambar tidak ditemukan");
            }

            
            const validUrls = data.filter(url => !url.includes("cloudkuimages.guru"));

            if (validUrls.length === 0) {
                throw new Error("Semua link gambar di database sedang mati/expired.");
            }

            
            const randomUrl = validUrls[Math.floor(Math.random() * validUrls.length)];

            
            const response = await axios.get(randomUrl, { 
                responseType: "arraybuffer",
                timeout: 5000 
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
