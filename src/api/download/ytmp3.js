const axios = require('axios');
const cheerio = require('cheerio');

async function ytmp3(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^&\n?#]+)/);

  if (!match) {
    throw new Error('URL YouTube tidak valid');
  }

  const id = match[1];

  // 1. Ambil metadata dari oembed
  const meta = await axios.get(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  );

  // 2. Tembak form konversi di id.ytmp3.mobi
  const init = await axios.get(`https://id.ytmp3.mobi/vkO/?url=${encodeURIComponent(url)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
      'Referer': 'https://id.ytmp3.mobi/vkO/'
    }
  });

  const $ = cheerio.load(init.data);
  let downloadUrl = $('#downloadLink').attr('href') || $('a.btn-download').attr('href') || $('a[href*="get"]').attr('href');

  // Fallback ke API internal jika link tidak ada di HTML statis
  if (!downloadUrl) {
    const apiRes = await axios.post('https://id.ytmp3.mobi/api/v1/convert', {
      url: `https://www.youtube.com/watch?v=${id}`,
      format: 'mp3'
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://id.ytmp3.mobi/vkO/'
      }
    }).catch(() => null);

    downloadUrl = apiRes?.data?.url || apiRes?.data?.downloadUrl;
  }

  if (!downloadUrl) {
    throw new Error('Gagal mengambil link MP3 dari id.ytmp3.mobi');
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
      url: downloadUrl
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
