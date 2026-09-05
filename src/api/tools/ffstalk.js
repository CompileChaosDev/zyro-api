const axios = require('axios');

const BaseUrl = 'https://freefire.my.id/api/ff';

async function getFFData(uid) {
  try {
    if (!uid || isNaN(uid)) {
      throw new Error('UID tidak valid. Harus berupa angka.');
    }

    const res = await axios.get(BaseUrl, {
      params: { uid: uid },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
        'Referer': `https://freefire.my.id/stalk/${uid}`,
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 30000
    });

    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Gagal mengambil data Free Fire.');
  }
}

module.exports = function (app) {
  app.get('/stalk/ff', async (req, res) => {
    try {
      const { uid } = req.query;

      if (!uid) {
        return res.status(400).json({
          status: false,
          creator: 'zyro',
          error: "Parameter 'uid' wajib diisi (contoh: ?uid=12345678)"
        });
      }

      const data = await getFFData(uid);

      return res.status(200).json({
        status: true,
        creator: 'zyro',
        result: data
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        creator: 'zyro',
        error: err.message
      });
    }
  });
};
