const fs = require('fs');
const path = require('path');
require('dotenv').config();

const usersDir = path.join(__dirname, 'data', 'users');

class DataSaver{
    ensureDir() {
        if (!fs.existsSync(usersDir)) {
            fs.mkdirSync(usersDir, { recursive: true });
        }
    }
    createUserSync(userData) {
        ensureDir();
        const id = Date.now();
        const user = { id, ...userData, createdAt: new Date().toISOString() };
        fs.writeFileSync(path.join(usersDir, `${id}.json`), JSON.stringify(user, null, 2));
        return user;
    }
    getUserByIdSync(id) {
        const filePath = path.join(usersDir, `${id}.json`);
        if (!fs.existsSync(filePath)) return null;
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
}