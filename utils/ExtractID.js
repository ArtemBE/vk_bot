function extractID(string_url, type='video'){
    const url = 
        new URL(string_url).host.split('.')[0]=="vk"?
        new URL(new URL(string_url).searchParams.get('to')).searchParams.get('v'):
        new URL(string_url);
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
    }
}
module.exports = {extractID}
