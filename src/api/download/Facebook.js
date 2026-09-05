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

async function fetchWayInMeta(fbUrl) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'Content-Type': 'application/json',
            'Origin': 'https://wayin.ai',
            'Referer': 'https://wayin.ai/',
            'X-Platform': 'web'
        };

        const parseRes = await axios.post(
            `https://wayinvideo-api.wayin.ai/api/parse_url?url=${encodeURIComponent(fbUrl)}`,
            {},
            { headers }
        );

        const cleanVideoUrl = parseRes.data?.data || fbUrl;

        const metaRes = await axios.post(
            'https://wayinvideo-api.wayin.ai/api/p/v2/get_video_meta',
            { video_url: cleanVideoUrl },
            { headers }
        );

        const meta = metaRes.data?.data || {};

        return {
            title: meta.title || null,
            author: meta.author || null,
            abstract: meta.abstract || null,
            duration: meta.duration ? `${Math.floor(meta.duration / 1000)}s` : null,
            view_count: meta.view_count || 0,
            comment_count: meta.comment_count || 0,
            like_count: meta.like_count || 0,
            published_at: meta.published_at ? new Date(meta.published_at * 1000).toISOString() : null,
            resolution: meta.res || null
        };
    } catch {
        return null;
    }
}

async function fbDownloader(fbUrl) {
    const [fgetData, metaData] = await Promise.all([
        fetchFgetLinks(fbUrl),
        fetchWayInMeta(fbUrl)
    ]);

    if (!fgetData.downloads.length) {
        throw new Error('Gagal mengambil link download media.');
    }

    return {
        metadata: metaData || { title: 'No Metadata Available' },
        downloads: {
            thumbnail: fgetData.thumbnail,
            links: fgetData.downloads
        }
    };
}

module.exports = function (app) {
    app.get('/download/facebook', async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    creator: 'zyro',
                    message: "Parameter 'url' wajib diisi (contoh: ?url=https://www.facebook.com/...)"
                });
            }

            const data = await fbDownloader(url);

            return res.status(200).json({
                status: true,
                creator: 'zyro',
                result: data
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
