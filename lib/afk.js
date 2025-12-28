const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/afk.json');

function load() {
    if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_PATH));
}

function save(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    set(jid, reason = 'AFK', media = null) {
        const db = load();
        db[jid] = {
            reason,
            time: Date.now(),
            media
        };
        save(db);
    },

    get(jid) {
        return load()[jid];
    },

    del(jid) {
        const db = load();
        delete db[jid];
        save(db);
    },

    all() {
        return load();
    }
};
