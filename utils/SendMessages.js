const { VK } = require("vk-io");
const vk = new VK({ token: process.env.VK_TOKEN });

async function sendMessages(list){
    if(!Array.isArray(list)) throw new Error("Некорректный массив данных");
    for(let i=0;i<list.length;i++){
        try{
            await vk.api.messages.send(list[i]);
            if(i<list.length-1) await new Promise(res=>setTimeout(res, 1000));
        }
        catch(e){
            console.log("SM ERRor")
            throw e;
        }
    }
}

module.exports = {sendMessages}