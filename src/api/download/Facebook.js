const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

async function fetchFgetLinks(fbUrl) {
  try {
    const payload = qs.stringify({ id: fbUrl, locale: 'id' });
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Hx-Current-Url': 'https://fget.io/id',
      'Hx-Request': 'true',
      'Hx-Target': 'target',
      'Hx-Trigger': 'form',
      'Origin': 'https://fget.io',
      'Referer': 'https://fget.io/id'
    };

    const { data: html } = await axios.post('https://fget.io/process', payload, { headers });
    const $ = cheerio.load(html);

    const thumbnail = $('.result-thumbnail img').attr('src') || null;
    const downloads = [];

    $('.space-y-2 .flex').each((_, el) => {
      const quality = $(el).find('.text-sm').text().trim();
      const type = $(el).find('.text-xs').text().replace(/[()]/g, '').trim();
      const url = $(el).find('a').attr('href');

      if (quality && url) {
        downloads.push({ quality, type, url });
      }
    });

    return { thumbnail, downloads };
  } catch {
    return { thumbnail: null, downloads: [] };
  }
}

module.exports = function (app) {
  app.get('/download/facebook', async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          status: false,
          creator: 'zyro',
          message: "Parameter 'url' wajib diisi"
        });
      }

      const data = await fetchFgetLinks(url);

      if (!data.downloads.length) {
        return res.status(500).json({
          status: false,
          creator: 'zyro',
          message: 'Gagal mengambil media Facebook. Pastikan link publik.'
        });
      }

      return res.status(200).json({
        status: true,
        creator: 'zyro',
        result: {
          thumbnail: data.thumbnail,
          media: data.downloads
        }
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