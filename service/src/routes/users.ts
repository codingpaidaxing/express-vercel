import express, { Request, Response } from 'express';
// 通过命令 npm i sha1 安装 sha1
var sha1 = require('sha1');
import axios from 'axios';
import config from '../config/index';
import { sendResponse } from '../utils'

const router = express.Router();
const { appid, secret } = config;


/* GET users listing. */
router.get('/', async function(req, res, next) {
    // 1. 获取当前页面 URL中的code
    const code: string = req.query.code as string;
    // 2. 通过code换取网页授权access_token 和 openid  userAccessToken
    const result = await userAccessToken(code);
    const access_token = result.data.access_token;
    const openid = result.data.openid
    // 3. 根据access_token 和 openid获取用户信息
    const userInfo = userInfoByAccessTokenAndOpenId(access_token, openid);
    console.log("userInfo:", userInfo);
    res.send(userInfo);
});
// 通过code换取网页授权access_token
async function userAccessToken(code: string) {
    try {
      // 替换以下链接中的参数为实际值
      var access_token_url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;
      let access_token_data = await axios.get(access_token_url);
  
      let access_token = access_token_data.data.access_token;
      let openid = access_token_data.data.openid;
  
      // 拉取用户信息
      let user_info_url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
      console.log("user_info_url", user_info_url);
  
      return sendResponse({
        type: 'Success',
        data: access_token_data.data,
      });
    } catch (error: any) {
      console.error('Error fetching access token:', error);
      return sendResponse({
        type: 'Fail',
        message: error.message ?? 'Failed',
      });
    }
  };

// 用户信息
async function userInfoByAccessTokenAndOpenId(access_token:string, openid:string) {
    axios.get(`https://wx.ibitly.cn/user-info?access_token=${access_token}&openid=${openid}&lang=zh_CN`)
    .then(resp => {
        console.log('用户信息：', resp);
        // 将获取到的用户信息直接赋值给 userInfoData
        return resp.data;
    })
};



router.get('/wx-auth', function(req, res, next) {
    let {signature, timestamp, nonce, echostr} = req.query;
    let token = 'paidaxing';
    let array = [timestamp, nonce, token];
    array.sort(); // 字典排序
    let str = array.join('');
    let resultStr = sha1(str) // 对字符串str进行sha1进行加密
    if(resultStr === signature) {
      res.set('Content-Type', 'text/plain')
      res.send(echostr);
    }else {
      res.send('Error!!!!!!')
    }
  });
  


export default router;