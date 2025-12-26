/* eslint-disable import/no-extraneous-dependencies */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { JSDOM } = require('jsdom');

class EzGif {

    static async upload(filePath, converter) {
        const form = new FormData();
        form.append('new-image-url', '');
        form.append('new-image', fs.createReadStream(filePath));

        const { data } = await axios.post(
            `https://s6.ezgif.com/${converter}`,
            form,
            { headers: form.getHeaders() }
        );

        const dom = new JSDOM(data).window.document;

        return {
            file: dom.querySelector('input[name="file"]')?.value,
            convert: dom.querySelector('input[name="convert"]')?.value
        };
    }

    static async convert(file, converter, convert) {
        const form = new FormData();
        form.append('file', file);
        form.append('convert', convert);

        const { data } = await axios.post(
            `https://ezgif.com/${converter}/${file}`,
            form,
            { headers: form.getHeaders() }
        );

        const dom = new JSDOM(data).window.document;
        const src = dom.querySelector('#output video source')?.getAttribute('src');

        if (!src) throw new Error('Convert failed');

        return `https:${src}`;
    }

    // ✅ INI YANG DIPAKAI
    static async WebP2mp4(filePath) {
        const upload = await EzGif.upload(filePath, 'webp-to-mp4');
        if (!upload?.file) throw new Error('Upload failed');

        return await EzGif.convert(upload.file, 'webp-to-mp4', upload.convert);
    }
}

module.exports = EzGif;
