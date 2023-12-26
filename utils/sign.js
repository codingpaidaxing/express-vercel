var {appid, secret} = require('../config')

// 通过命令 npm i axios 安装 axios
var axios = require('axios')

// 获取access token的接口：https请求方式: GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET

// 获取ticket方法函数
async function getTicket() {
    let tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=$${secret}`
    let token_data = await axios.get(tokenUrl);
    console.log('token_data', token_data);

    let access_toekn = token_data.data.access_toekn; // 获取access_toekn
    // 参考官方文档：https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#62
    let ticketUrl = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_toekn}&type=jsapi`
    let ticket_data = await axios.get(ticketUrl); // 获取jsapi的ticket
    console.log('ticket_data', ticket_data);
    return ticket_data.data.ticket;
}


