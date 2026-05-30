const axios = require('axios');
const fs = require('fs');
const { YtDlp } = require('ytdlp-nodejs');
const ytdlp = new YtDlp();
const { createWriteStream } = require('fs');
require('dotenv').config();
const {Keyboard} = require('vk-io');
const { DataSaver } = require('./DataSaver');
const { User } = require('./User');
const youtube = require('googleapis').google.youtube({
    version: 'v3',
    auth: process.env.API_KEY,
});
const saver = new DataSaver();

class YTHandler{
    async download(url){
        const result = await ytdlp
        .download(url)
        .filter('mergevideo')
        .quality('1080p')
        .type('mp4')
        .output(process.env.DIRECTORY+'/src/videos')
        .on('progress', (p) => console.log(`${p.percentage_str}`))
/*         .on('finish', ()=>{console.log(343434)})
        .on('error', e=>{console.log(e.message)}) */
        .run();
        return result;
    }
    async pipeload(url){
        const result = await ytdlp
        .stream(url)
        .filter('audioandvideo')
        .quality('1080p')
        .type('mp4')
        .on('progress', (p) => console.log(`${p.percentage_str}`))
        .pipeAsync(createWriteStream('video.mp4'));
        return result;
    }
    async getList(query, maxResults=10, type="video"){
/*         const request = `GET https://www.googleapis.com/youtube/v3/search?`+
        `part=snippet` +
        `&q=${encodeURIComponent(query)}` +
        `&maxResults=${maxResults}` +
        `&type=${type}` +
        `&key=${process.env.API_KEY}`;         */
        const request = `https://www.googleapis.com/youtube/v3/search`
        const params = {
            part: 'snippet',
            q: query,
            maxResults: maxResults,
            type: type,
        };

        try{
            //const responce = await axios.get(request, {params: params});
            const responce = await youtube.search.list(params)
            return responce.data;
        } catch(e){
            console.log("Вот такая ошибка: " + e.message)
            console.log("Вот такой ответ: " + e.responce?.data)
        }
    }
    async getVideoInfo(id){
        const responce = await youtube.videos.list({
            part: ['snippet'],
            id: id,
        })
        return responce.data.items[0];
    }
    async getChannelInfo(id){
        const responce = await youtube.channels.list({
            part: ['snippet'],
            id: id,
        })
        return responce.data.items[0];
    }
    async getChannelVideos(id, maxResults=10, order="date"){
        const responce = await youtube.search.list({
            channelId: /* "UCmSImlPUez2i1wvsctTB0Gw" */id,
            part: "snippet",
            maxResults: maxResults,
            type: "video",
            order: order,
        })
        return responce.data;
    }
}

class VKHandler{
    constructor(){
        this.yth=new YTHandler();
    }
    reportError(message){
        const reply = {
            peer_id: msg.peer_id,
            message: `Ошибка: ${message}`,
            random_id: Math.floor(Math.random() * 1000000), 
        }
        return reply;
    }
    selectServiceInterface(body){
        const msg = body.object.message;
        saver.createUserSync({id: body.peer_id, state: "selectService"})
        const kb = Keyboard.builder()
        .textButton({label: "youtube", payload: {command: "selectService", item: "youtube"}})
        .inline(false).toString();
        const reply = {
            peer_id: msg.peer_id,
            message: `Выберите сервис ${msg.from_id}`,
            random_id: Math.floor(Math.random() * 1000000), 
            keyboard: kb
        }
        return reply;
    }
    ytSelectOperationInterface(body){
        const msg = body.object.message;
        saver.createUserSync({id: body.peer_id, state: `ytSelectOperation`})
        const kb = Keyboard.builder()
        .textButton({label: "Найти видео", payload: 
            {command: "ytSelectOperation", operation: "search", item: "video"}})
        .textButton({label: "Получить видео", payload: 
            {command: "ytSelectOperation", operation: "get", item: "video"}})
        .row()
        .textButton({label: "Найти канал", payload: 
            {command: "ytSelectOperation", operation: "search", item: "channel"}})
        .textButton({label: "Получить канал", payload: 
            {command: "ytSelectOperation", operation: "get", item: "channel"}})
        .row()
        .textButton({label: "Перезапуск", payload: {command: "restart"}})
        .inline(false).toString();
        const reply = {
            peer_id: msg.peer_id,
            message: `Выберите действие`,
            random_id: Math.floor(Math.random() * 1000000), 
            keyboard: kb
        }
        return reply;
    }
    ytInputQueryInterface(body, oper, item){
        const msg = body.object.message;
        saver.createUserSync({
            id: body.peer_id, 
            state: `ytInputQuery`,
            operation: oper,
            item: item,
        })
        const kb = Keyboard.builder()
        .textButton({label: "Перезапуск", payload: {command: "restart"}})
        .inline(false).toString();
        const reply = {
            peer_id: msg.peer_id,
            message: `Введите ${oper=="search"?"запрос":"ссылку"}`,
            random_id: Math.floor(Math.random() * 1000000), 
            keyboard: kb
        }
        return reply;
    }
    async ytExecuteSearch(body, item){
        const msg = body.object.message;
        const list = await this.yth.getList(msg.text, 10, item);
        return list;
    }
    async ytExecuteGet(body, item){
        const msg = body.object.message;
        const video_id = new URL(msg.text).searchParams.get('v');
        const list = await this.yth.getVideoInfo(video_id);
        return list;
    }

    async handleMessage(body){
        const msg = body.object.message;
        const payload = msg.payload??null;
        const user = saver.getUserByIdSync(body.peer_id);
        const kb = Keyboard.builder()
        .textButton({
            label: '📸 Фото',
        })
/*         .callbackButton({

        }) */
        .textButton({
            label: '🎵 Музыка',
        }).inline(false) // false - обычная клавиатура (всегда видна)
        .toString();
        console.log(kb)
        console.log(msg.text);
        
        if(msg.text=="Клава"){
            const reply = {
                peer_id: msg.peer_id,
                message: `Привет! Пока что я отвечаю только стандартным текстом. ${msg.from_id}`,
                random_id: Math.floor(Math.random() * 1000000), 
                keyboard: kb
            }
            return reply;
        }
        else if(payload.command=="restart"){
            const reply = this.selectServiceInterface(body);
            return reply;
        }
        else if(["начать", "начало"].includes(msg.text.toLowerCase())){
            const reply = this.selectServiceInterface(body);
            return reply;
        }
        else if(payload && payload.command=="selectService" && payload.item=="youtube"){
            const reply = this.ytSelectOperationInterface(body, payload.operation, payload.item);
            return reply;
        }
        else if(payload.command=="ytSelectOperation"){
            const reply = this.ytInputQueryInterface(body, payload.operation, payload.item);
            return reply;
        }
        else if(payload.command=="ytInputQuery" && user.operation=="search"){
            const reply = await this.ytExecuteSearch(body, user.item);
            return reply;
        }
        else if(payload.command=="ytInputQuery" && user.operation=="get"){
            const reply = await this.ytExecuteGet(body, user.item);
            return reply;
        }
        else{
            const reply = {
                peer_id: msg.peer_id,
                message: `Привет! Пока что я отвечаю только стандартным текстом. ${msg.from_id}`,
                random_id: Math.floor(Math.random() * 1000000), 
                /* keyboard: kb */
            }
            return reply;
        }
    }
}

module.exports = { YTHandler, VKHandler };