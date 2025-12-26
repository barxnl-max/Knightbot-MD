/* eslint-disable import/no-extraneous-dependencies */
// by barxnl250_
const { default: axios } = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { JSDOM } = require('jsdom');

class EzGif {
    constructor() {}

    /**
     * Upload file to ezgif server
     * @param {string} path file path
     * @param {string} converter
     */
    static async upload(path, converter) {
        const form = new FormData();
        form.append('new-image-url', '');
        form.append('new-image', fs.createReadStream(path));

        const { data } = await axios.post(
            `https://s6.ezgif.com/${converter}`,
            form,
            {
                headers: form.getHeaders(),
                timeout: 30000,
            }
        );

        const dom = new JSDOM(data).window.document;

        const file = dom.querySelector('input[name="file"]')?.getAttribute('value');
        const convert = dom.querySelector('input[name="convert"]')?.getAttribute('value');

        if (!file || !convert) {
            throw new Error('Failed to upload to EzGif');
        }

        return { file, convert };
    }

    /**
     * Convert file
     */
    static async convert(file, converter, convert) {
        const form = new FormData();
        form.append('file', file);
        form.append('convert', convert);

        const { data } = await axios.post(
            `https://ezgif.com/${converter}/${file}`,
            form,
            {
                headers: form.getHeaders(),
                timeout: 30000,
            }
        );

        const dom = new JSDOM(data).window.document;
        const src = dom.querySelector('#output video source')?.getAttribute('src');

        if (!src) {
            throw new Error('Failed to convert file');
        }

        return `https:${src}`;
    }

    /**
     * Convert WebP → MP4
     */
    static async WebP2mp4(file) {
        const upload = await EzGif.upload(file, 'webp-to-mp4');
        const result = await EzGif.convert(
            upload.file,
            'webp-to-mp4',
            upload.convert
        );
        return result;
    }
}

module.exports = EzGif;
