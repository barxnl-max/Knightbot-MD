const fs = require('fs');
const path = require('path');

const NSFW_DIR = path.join(__dirname, 'nsfw');

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getCategories() {
    if (!fs.existsSync(NSFW_DIR)) return [];
    return fs.readdirSync(NSFW_DIR)
        .filter(v => v.endsWith('.json'))
        .map(v => v.replace('.json', ''));
}

function getRandom(category = null) {
    const categories = getCategories();
    if (!categories.length) throw new Error('No nsfw files');

    if (!category) category = random(categories);
    if (!categories.includes(category)) {
        throw new Error('Invalid category');
    }

    const filePath = path.join(NSFW_DIR, category + '.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(data) || !data.length) {
        throw new Error('Empty file');
    }

    return {
        category,
        url: random(data)
    };
}

module.exports = {
    getCategories,
    getRandom
};
