const fs = require('fs');
const path = require('path');
require('dotenv').config();

const usersDir = path.join(process.env.DIRECTORY, 'data', 'users');

class DataSaver{
    ensureDir() {
        if (!fs.existsSync(usersDir)) {
            fs.mkdirSync(usersDir, { recursive: true });
        }
    }
    createUserSync(userData) {
        this.ensureDir();
        const id = userData.id;
        fs.writeFileSync(path.join(usersDir, `${id}.json`), JSON.stringify(userData, null, 2));
        return userData;
    }
    getUserByIdSync(id) {
        const filePath = path.join(usersDir, `${id}.json`);
        if (!fs.existsSync(filePath)) return null;
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
}
module.exports={DataSaver}