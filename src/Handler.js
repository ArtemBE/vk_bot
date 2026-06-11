const axios = require('axios');
const fs = require('fs');
const { YtDlp } = require('ytdlp-nodejs');
const ytdlp = new YtDlp();
const { createWriteStream } = require('fs');
require('dotenv').config();
const { Keyboard, VK } = require('vk-io');
const { DataSaver } = require('./DataSaver');
const { User } = require('./User');
const { extractID } = require('./../utils/ExtractID');
const youtube = require('googleapis').google.youtube({
    version: 'v3',
    auth: process.env.API_KEY,
});
const vk = new VK({ token: process.env.VK_TOKEN });
const saver = new DataSaver();
const {digitsKeyboard} = require('../utils/DigitsKeyboard')
//Проверка

class YTHandler{
    async download(url){
        const result = await ytdlp
        .download(url)
        .filter('mergevideo')
        .quality('1080p')
        .type('mp4')
        .output(process.env.DIRECTORY+'/src/videos')
        .on('progress', (p) => console.log(`${p.percentage_str}`))
        .run();
        return result;
    }
    async pipeload(url, stream=process.env.DIRECTORY+"/data/videos/video.mp4"){
        try{
            const result = await ytdlp
            .stream(url)
            .filter('audioandvideo')
            .quality('1080p')
            .type('mp4')
            .on('progress', (p) => console.log(`${p.percentage_str}`))
            .pipeAsync(createWriteStream(stream));
            return result;
        }
        catch(e){
            e.message = "Ошибка загрузки видео";
            throw e;
        }
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
            part: "snippet",
            q: query,
            maxResults: maxResults,
            type: type,
        };

        try{
            //const responce = await axios.get(request, {params: params});
            const responce = await youtube.search.list(params)
            return responce.data.items;
        } catch(e){
            //e.message = "Ошибка поиска";
            throw e;
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
        try{
           const responce = await youtube.channels.list({
                part: ['snippet', 'statistics'],
                id: id,
            }) 
            return responce.data.items[0];
        }
        catch(e){
            e.message = "Некорректный идентификатор канала";
            throw e;
        }
    }
    async getChannelVideos(id, maxResults=10, order="date"){
        const responce = await youtube.search.list({
            channelId: /* "UCmSImlPUez2i1wvsctTB0Gw" */id,
            part: "snippet",
            maxResults: maxResults,
            type: "video",
            order: order,
        })
        return responce.data.items;
    }
}

class VKHandler{
    constructor(){
        this.yth=new YTHandler();
    }
    reportError(message, peer_id, stack=null){
        const reply = {
            peer_id: peer_id,
            message: `Ошибка: ${message}`,
            random_id: Date.now(), 
        }
        if(stack) console.log(stack);
        return reply;
    }
    sendSelectServiceInterface(body){
        const msg = body.object.message;
        const user = {id: msg.peer_id, state: "selectService"};
        //saver.createUserSync(user)
        const kb = Keyboard.builder()
        .textButton({label: "youtube", payload: {command: "selectService", item: "youtube"}})
        .inline(false).toString();
        const reply = {
            peer_id: msg.peer_id,
            message: `Выберите сервис ${msg.from_id}`,
            random_id: Date.now(), 
            keyboard: kb
        }
        return {reply, user};
    }
    ytSendSelectOperationInterface(body){
        const msg = body.object.message;
        const user = {id: msg.peer_id, state: `ytSelectOperation`};
        //saver.createUserSync(user)
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
            random_id: Date.now(), 
            keyboard: kb
        }
        return {reply, user};
    }
    ytSendInputQueryInterface(body, oper, item){
        const msg = body.object.message;
        const user = {
            id: msg.peer_id, 
            state: `ytInputQuery`,
            operation: oper,
            item: item,
        }
        //saver.createUserSync(user)
        const kb = Keyboard.builder()
        .textButton({label: "Перезапуск", payload: {command: "restart"}})
        .inline(false).toString();
        let inputType;
        if(oper=="search") inputType="запрос"
        else if(oper=="get" && item=="video") inputType="ссылку"
        else if(oper=="get" && item=="channel") inputType="индентификатор";
        const reply = {
            peer_id: msg.peer_id,
            message: `Введите ${inputType}`,
            random_id: Date.now(), 
            keyboard: kb
        }
        return {reply, user};
    }
/*     constructReplyVideo(video, desc=false){
        return {
            peer_id: msg.peer_id,
            message: `Название: ${video.title}\n`+
            `Канал: ${video.channelTitle}\n`+
            `Дата публикации: ${video.publishedAt}\n`+
            `Ссылка: https://www.youtube.com/watch?v=${video.videoId}`,
            attachment: attachment,
            random_id: Date.now(), 
            keyboard: kb
        }
    } */
    async ytSearchVideo(body){
        const msg = body.object.message;
        const list = await this.yth.getList(msg.text, 50, "video");
        const kb = digitsKeyboard()
        .textButton({label: "Перезапуск", payload: {command: "restart"}})
        .inline(false).toString();
        const user = {id: msg.peer_id, state: `ytVideos`, ytVideosList: ''};
        
        const resList = list.map(i=>({
            title: i.snippet.title,
            channelTitle: i.snippet.channelTitle,
            publishedAt: i.snippet.publishedAt,
            videoId: i.id.videoId,
            description: i.snippet.description,
            defaultURL: i.snippet.thumbnails.default.url,
            highURL: i.snippet.thumbnails.high.url,
        }))
        user.ytVideosList = resList;
        user.page = 0;
        const l = resList.slice(0, 10).length
        const reply = await Promise.all(resList.slice(0, 10).map(async (i, n)=>{
            let attachment;
            try{
                attachment = await vk.upload.messagePhoto({
                    source: {value: i.defaultURL}
                });   
            }
            catch{
                try{
                    attachment = await vk.upload.messagePhoto({
                        source: {value: process.env.DIRECTORY+"/data/images/no_photo.jpg"}
                    });  
                }
                catch{
                    attachment = null;
                }
            }
                     
            const result = {
                peer_id: msg.peer_id,
                message: `Название: ${i.title}\n`+
                `Канал: ${i.channelTitle}\n`+
                `Дата публикации: ${i.publishedAt}\n`+
                `Ссылка: https://www.youtube.com/watch?v=${i.videoId}\n`+
                `Номер: ${n+1}`,
                random_id: Date.now(),
            }
            if(n==l-1) result.keyboard = kb;
            if(attachment!=null) result.attachment = attachment
            else result.message = `Не удалось загрузить изображение\n\n\n`+result.message;
            return result;
        }))
        return {reply, user};
    }
    async ytSearchChannel(body){
        const msg = body.object.message;
        const list = await this.yth.getList(msg.text, 10, "channel");
        const kb = digitsKeyboard()
        .textButton({label: "Перезапуск", payload: {command: "restart"}})
        .inline(false).toString();
        const user = {id: msg.peer_id, state: `ytChannels`};
        
        const reply = await Promise.all(list.map(async (i, n)=>{
            let attachment;
            try{
                attachment = await vk.upload.messagePhoto({
                    source: {value: i.snippet.thumbnails.default.url}
                });   
            }
            catch{
                attachment = await vk.upload.messagePhoto({
                    source: {value: process.env.DIRECTORY+"/data/images/no_photo.jpg"}
                });  
            }
                     
            const result = {
                peer_id: msg.peer_id,
                message: `Название: ${i.snippet.title}\n`+
                `Дата создания: ${i.snippet.publishedAt}\n`+
                `Ссылка: https://www.youtube.com/${i.snippet.customUrl}\n`+
                `Идентификатор: ${i.snippet.channelId}`,
                attachment: attachment,
                random_id: Date.now(),
            }
            if(n==list.length-1) result.keyboard = kb;
            return result;
        }))

        return {reply, user};
    }
    async ytGetVideo(body){
        const msg = body.object.message;
        const video_id = extractID(msg.text);
        const video = await this.yth.getVideoInfo(video_id);
        const user = {id: msg.peer_id, state: `ytVideo`, ytVideoID: video_id};

        const kb = Keyboard.builder()
        .textButton({label: "Скачать", payload: {command: "ytDownloadVideo"}})
        .textButton({label: `Получить другое видео`, payload: 
            {command: "ytSelectOperation", operation: "get", item: "video"}})
        .row()
        .textButton({label: "Перезапуск", payload: {command: "restart"}})
        .inline(false).toString();
        let attachment;

        try{
            attachment = await vk.upload.messagePhoto({
                source: {value: video.snippet.thumbnails.high.url}
            });
        }
        catch{
            attachment = await vk.upload.messagePhoto({
                source: {value: process.env.DIRECTORY+"/data/images/no_photo.jpg"}
            });
        }
        const reply = {
            peer_id: msg.peer_id,
            message: `Название: ${video.snippet.title}\n`+
            `Канал: ${video.snippet.channelTitle}\n`+
            `Дата публикации: ${video.snippet.publishedAt}\n`+
            `Ссылка: https://www.youtube.com/watch?v=${video.id}`,
	        attachment: attachment,
            random_id: Date.now(), 
            keyboard: kb
        }
        return {reply, user};
    }
    async ytGetChannel(body){
        const msg = body.object.message;
        const channel_id = msg.text;
        const channel = await this.yth.getChannelInfo(channel_id);
        const user = {id: msg.peer_id, state: `ytChannel`, ytChannelID: channel_id};

        const kb = Keyboard.builder()
        .textButton({label: `Получить другой канал`, payload: 
            {command: "ytSelectOperation", operation: "get", item: "channel"}})
        .row()
        .textButton({label: "Перезапуск", payload: {command: "restart"}})
        .inline(false).toString();
        let attachment;

        try{
            attachment = await vk.upload.messagePhoto({
                source: {value: channel.snippet.thumbnails.high.url}
            });
        }
        catch{
            attachment = await vk.upload.messagePhoto({
                source: {value: process.env.DIRECTORY+"/data/images/no_photo.jpg"}
            });
        }
        console.log(channel)
        const reply = {
            peer_id: msg.peer_id,
            message: `Название: ${channel.snippet.title}\n`+
            `Дата создания: ${channel.snippet.publishedAt}\n`+
            `Количество подписчиков: ${channel.statistics.subscriberCount}\n`+
            `Ссылка: https://www.youtube.com/${channel.snippet.customUrl}\n`+
            `Идентификатор: ${channel.id}`
            `Описание: ${channel.snippet.description}`,
	        attachment: attachment,
            random_id: Date.now(),
            keyboard: kb,
        }
        return {reply, user};
    }
    async ytGetVideoFromObject(body, video, n=null){
        const msg = body.object.message;
        //const user = {id: msg.peer_id, state: `ytVideo`, ytVideoID: video.videoId};
        const user = saver.getUserByIdSync(msg.peer_id)
        user.state = `ytVideo`;
        user.ytVideoID = video.videoId;

        const kb = Keyboard.builder()
        .textButton({label: "Скачать", payload: {command: "ytDownloadVideo"}})
        .textButton({label: `Получить другое видео`, payload: 
            {command: "ytSelectOperation", operation: "get", item: "video"}})
        .row()
        .textButton({label: "Перезапуск", payload: {command: "restart"}})
        .inline(false).toString();
            
        let attachment;

        try{
            attachment = await vk.upload.messagePhoto({
                source: {value: n==null?video.highURL:video.defaultURL}
            });
        }
        catch{
            attachment = await vk.upload.messagePhoto({
                source: {value: process.env.DIRECTORY+"/data/images/no_photo.jpg"}
            });
        }
        const reply = {
            peer_id: msg.peer_id,
            message: `Название: ${video.title}\n`+
            `Канал: ${video.channelTitle}\n`+
            `Дата публикации: ${video.publishedAt}\n`+
            `Ссылка: https://www.youtube.com/watch?v=${video.videoId}`,
	        attachment: attachment,
            random_id: Date.now(),
        }
        if(n===null) reply.keyboard = kb
        else reply.message=reply.message+`\nНомер: ${n}`
        return {reply, user};
    }
    async getPageVideos(body, n){
        const msg = body.object.message;
        const user = saver.getUserByIdSync(msg.peer_id);
        if(n*10>=user.ytVideosList.length) throw new Error("Больше видео нет");
        user.page = n;
        const list = user.ytVideosList.slice(n*10, (n+1)*10);
        const l = list.length;
        const reply = await Promise.all(
            list.map(async (i, n)=>
                (await this.ytGetVideoFromObject(body, i, n+1, (l==n+1)?l:null)).reply
            )
        )
        reply.push({
            peer_id: msg.peer_id,
            message: `Готово`,
            keyboard: kb,
            random_id: Date.now(),
        })
        return {reply};
    }
    async ytDownloadVideo(body, id, name='video'){
        const msg = body.object.message;
        await this.yth.pipeload(`https://www.youtube.com/watch?v=${id}`);
        const videoAttachment = await vk.upload.messageDocument({
            source: {
                value: process.env.DIRECTORY+"/data/videos/video.mp4"
            },
            title: name,
            peer_id: msg.peer_id,
        });
        const reply = {
            peer_id: msg.peer_id,
            message: 'Готово!',
            attachment: videoAttachment.toString(),
            random_id: Date.now()
        }
        return {reply};
    }

    async handleMessage(body){
        const msg = body.object.message;
        const payload = msg.payload?JSON.parse(msg.payload):null;
        const user = saver.getUserByIdSync(msg.peer_id);
        const kb = Keyboard.builder()
        .textButton({
            label: '📸 Фото',
        })
        .textButton({
            label: '🎵 Музыка',
        }).inline(false) // false - обычная клавиатура (всегда видна)
        .toString();
        if(msg.text=="Клава"){
            const reply = {
                peer_id: msg.peer_id,
                message: `Привет! Пока что я отвечаю только стандартным текстом. ${msg.from_id}`,
                random_id: Date.now(), 
                keyboard: kb
            }
            return reply;
        }
        else if(payload?.command=="restart"){
            const reply = this.sendSelectServiceInterface(body);
            return reply;
        }
        else if(["начать", "начало"].includes(msg.text.toLowerCase())){
            const reply = this.sendSelectServiceInterface(body);
            return reply;
        }
        else if(payload && payload.command=="selectService" && payload.item=="youtube"){
            const reply = this.ytSendSelectOperationInterface(body, payload.operation, payload.item);
            return reply;
        }
        else if(payload?.command=="ytSelectOperation"){
            const reply = this.ytSendInputQueryInterface(body, payload.operation, payload.item);
            return reply;
        }
        else if(user.state=="ytInputQuery" && user.operation=="search"){
            let reply; 
            if(user.item=="video") reply = await this.ytSearchVideo(body, user.item);
            if(user.item=="channel") reply = await this.ytSearchChannel(body, user.item);
            return reply;
        }
        else if(user.state=="ytInputQuery" && user.operation=="get"){
            let reply;
            const msg = body.object.message;
            if(user.item=="video") reply = await this.ytGetVideo(body);
            if(user.item=="channel") reply = await this.ytGetChannel(body);
            return reply;
        }
        else if(user.state=="ytVideos" && payload?.command=="selectItem"){
            const pli = Number(payload.item);
            const video = user.ytVideosList.slice(user.page*10, (user.page+1)*10)[payload.item-1];
            const reply = await this.ytGetVideoFromObject(body, video, payload.item, 0);
            return reply;
        }
        else if(user.state=="ytVideos" && payload?.command=="arrowNext"){
            const video = user.ytVideosList.slice(user.page*10, (user.page+1)*10)[payload.item-1];
            const reply = await this.getPageVideos(body, user.page+1);
            return reply;
        }
        else if(user.state=="ytVideo" && payload?.command=="ytDownloadVideo"){
            const reply = await this.ytDownloadVideo(body, user.ytVideoID);
            return reply;
        }
        else if(payload?.command==""){

        }
        else{
            const reply = {
                peer_id: msg.peer_id,
                message: `Привет! Пока что я отвечаю только стандартным текстом. ${msg.from_id}`,
                random_id: Date.now(), 
                /* keyboard: kb */
            }
            throw new Error("Такая функция пока что недоступна");
            //return reply;
        }
    }
}

module.exports = { YTHandler, VKHandler };
