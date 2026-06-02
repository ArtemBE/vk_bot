function extractID(string_url, type='video'){
    let url;
    try{
        url = 
        new URL(string_url).host.split('.')[0]=="vk"?
        new URL(new URL(string_url).searchParams.get('to')):
        new URL(string_url);
    }
    catch(e){
        throw new Error("Некорректная ссылка")
    }
    if(type=="video"){
        if(url.host=="youtu.be"){
            return url.pathname.slice(1);
        }
        else if(url.host.endsWith("youtube.com")){
            //video
            if(url.pathname.startsWith('/watch'))
                return url.searchParams.has('v')?
                    url.searchParams.get('v'):
                    url.pathname.split('/')[2];
            else if(
                ['/shorts', '/live', '/embed', '/v']
                .reduce((a, v)=>a||url.pathname.startsWith(v), false)
            )
                return url.pathname.split('/')[2];
            //channel
            else if(url.pathname.startsWith('/@'))
                return url.slice(2);
            else return null;
        }
        else throw new Error("Некорректная ссылка");
    }
}
module.exports = {extractID}
