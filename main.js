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
const { YTHandler, VKHandler } = require(process.env.DIRECTORY+'/src/Handler.js')
const yth = new YTHandler();
const vkh = new VKHandler();
const {VK} = require('vk-io')
const vk = new VK({ token: process.env.VK_TOKEN });
const {User}=require(process.env.DIRECTORY+"/src/User.js")
const {DataSaver} = require(process.env.DIRECTORY+"/src/DataSaver.js")
const saver = new DataSaver();

const youtube = require('googleapis').google.youtube({
    version: 'v3',
    auth: process.env.API_KEY,
});

app.use(express.json());

app.get('/', (req, res)=>{
  res.send("<h1 style='color: red'>Пошел нахуй</h1>")
})

app.post('/vk/callback', (req, res)=>{
  if(req.body.type=="confirmation" && req.body.group_id==238469614)
    res.send("cc3397de")
  if(req.body.type === 'message_new') {
    vkh.handleMessage(req.body)
    .then(vk.api.messages.send/* console.log */)
    .catch(e=>{
      vk.api.messages.send(e.message);
      /* console.log(e.message); */
      //throw e;
    });
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
app.get('/user', (req, res)=>{
  const user = new User(123, "state2");
  saver.createUserSync(user);
  res.send(244433)
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