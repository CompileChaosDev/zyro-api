const axios = require('axios');

async function ytmp3(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^&\n?#]+)/);

  if (!match) {
    throw new Error('URL YouTube tidak valid');
  }

  const id = match[1];

  // Ambil metadata dari oembed
  const meta = await axios.get(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  );

  // Ambil link download dari y2jar
  const dl = await axios.get(
    `https://capi.y2jar.cc/scr/${id}?s=0`,
    {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://v2.y2jar.cc',
        'Referer': `https://v2.y2jar.cc/?id=${id}`,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/139.0.0.0 Mobile Safari/537.36'
      }
    }
  );

  if (!dl.data || !dl.data.downloadUrl) {
    throw new Error('Gagal mendapatkan link download dari provider');
  }

  return {
    metadata: {
      id,
      title: meta.data.title || null,
      author: meta.data.author_name || null,
      thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      source: url
    },
    download: {
      type: 'mp3',
      url: dl.data.downloadUrl
    }
  };
}

module.exports = function (app) {
  app.get('/download/ytmp3', async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          status: false,
          creator: 'zyro',
          message: "Parameter 'url' wajib diisi (contoh: ?url=https://youtu.be/...)"
        });
      }

      const result = await ytmp3(url);

      return res.status(200).json({
        status: true,
        creator: 'zyro',
        result
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        creator: 'zyro',
        message: err.message
      });
    }
  });
};
