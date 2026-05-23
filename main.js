console.log(343);

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const { YtDlp } = require('ytdlp-nodejs');
const ytdlp = new YtDlp();
const { createWriteStream } = require('fs');
const express = require('express')
const app = express();
const port = 3000;
const { YTHandler } = require(process.env.DIRECTORY+'/src/Handler.js')
const yth = new YTHandler();
const {VK} = require('vk-io')
const vk = new VK({ token: process.env.VK_TOKEN });

const youtube = require('googleapis').google.youtube({
    version: 'v3',
    auth: process.env.API_KEY,
});

app.get('/', (req, res)=>{
  res.send("<h1 style='color: red'>Пошел нахуй</h1>")
})

app.post('/vk/callback', (req, res)=>{
  if(req.body.type=="confirmation" && req.body.group_id==238469614)
    res.send("cc3397de")
  if(req.body.type === 'message_new') {
    const userMessage = req.body.object.message.text;
    const userId = req.body.object.message.from_id;
    const peerId = req.body.object.message.peer_id;
    console.log(userMessage);
    try{
      vk.api.messages.send({
        peer_id: peerId,
        message: "Привет! Пока что я отвечаю только стандартным текстом.",
        random_id: Math.floor(Math.random() * 1000000) // Уникальный ID для избежания дублей
      });
    }
    catch(e){
      console.log(e.message);
    }
    res.send('ok');
  }
})

app.get('/download', (req, res)=>{
  yth.download('https://youtu.be/fdvof0iRJf8?si=JghsviFD6bMsUcP3')
  .then(resp=>{
    console.log(resp)
    res.send("<h1 style='color: red'>Пошел нахуй download</h1>")
  })
})

app.get('/pipeload', async (req, res)=>{
  yth.pipeload('https://youtu.be/fdvof0iRJf8?si=JghsviFD6bMsUcP3')
  .then(resp=>{
    console.log(resp)
    res.send("<h1 style='color: red'>Пошел нахуй pipeload</h1>")
  })
})

app.get('/list', (req, res)=>{
  yth.getList("Жмиль", 3, "channel").then(data=>console.log(data) || res.json(data))
})

app.get('/info', (req, res)=>{
  yth.getVideoInfo('r6JyVyUxgBs').then(data=>console.log(data) || res.json(data))
})
app.get('/channelInfo', (req, res)=>{
  yth.getChannelInfo('UCmSImlPUez2i1wvsctTB0Gw').then(data=>console.log(data) || res.json(data))
})

app.get('/channelVideo', (req, res)=>{
  yth.getChannelVideos('UCmSImlPUez2i1wvsctTB0Gw', 5).then(data=>console.log(data) || res.json(data))
})

app.listen(process.env.PORT, process.env.IP, () => {
  console.log(`Сервер запущен на http://${process.env.IP}:${process.env.PORT}`);
});