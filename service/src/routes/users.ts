import express, { Request, Response } from 'express';
// 通过命令 npm i sha1 安装 sha1
import sha1 from 'sha1';

import axios from 'axios';
import config from '../config/index';
import { sendResponse } from '../utils'
const router = express.Router();
// const { appid, secret } = config;

const appid = process.env.WX_APPID
const secret = process.env.WX_SECRET

// 为了解决DEPTH_ZERO_SELF_SIGNED_CERT 是 Node.js 中一个与 SSL 证书相关的错误。这个错误通常出现在尝试访问使用自签名证书（self-signed certificate）的 HTTPS 网站时。

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

router.post('/wx-user', async function (req, res, next) {
  // 1. 获取当前页面 URL中的code
  const code: string = req.query.code as string;
  console.log('code:', code);
  const user_info = await getWxUser(code);
  console.log("============H5个人信息接口================")
  console.log({data: { wx_token: "token_paidaxing", user_info: user_info.data }})
  res.send({ status: 'Success', message: '', data: { wx_token: "token_paidaxing", user_info: user_info.data } })
});

/* GET users listing. */
async function getWxUser(code: string) {
  // 2. 通过code换取网页授权access_token 和 openid  userAccessToken
  const result = await userAccessTokenByCode(code);
  const access_token = result.data.access_token;
  const openid = result.data.openid
  console.log('access_token', access_token)
  console.log('openid', openid)
  // 3. 根据access_token 和 openid获取用户信息
  const userInfoData = await userInfoByAccessTokenAndOpenId(access_token, openid);
  console.log("userInfo:", userInfoData.data);
  return userInfoData;
};


/* GET users listing. */
router.get('/', async function (req, res, next) {
  // 1. 获取当前页面 URL中的code
  const code: string = req.query.code as string;
  // 2. 通过code换取网页授权access_token 和 openid  userAccessToken
  const result = await userAccessTokenByCode(code);
  const access_token = result.data.access_token;
  const openid = result.data.openid
  // 3. 根据access_token 和 openid获取用户信息
  const userInfoData = await userInfoByAccessTokenAndOpenId(access_token, openid);
  console.log("userInfo:", userInfoData.data);
  res.send(userInfoData.data);
});

// 通过code换取网页授权access_token
async function userAccessTokenByCode(code: string) {
  try {
    // 替换以下链接中的参数为实际值
    var access_token_url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;
    let access_token_data = await axios.get(access_token_url);
    console.log('access_token_data', access_token_data)
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
async function userInfoByAccessTokenAndOpenId(access_token: string, openid: string) {
  console.log(access_token, openid)
  let user_info_url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
  // let user_info_url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
  console.log("获取用户的请求地址:", user_info_url);
  let result = axios.get(user_info_url);
  return result;
};



router.get('/wx-auth', function (req, res, next) {
  let { signature, timestamp, nonce, echostr } = req.query;
  let token = 'paidaxing';
  let array = [timestamp, nonce, token];
  array.sort(); // 字典排序
  let str = array.join('');
  let resultStr = sha1(str) // 对字符串str进行sha1进行加密
  if (resultStr === signature) {
    res.set('Content-Type', 'text/plain')
    res.send(echostr);
  } else {
    res.send('Error!!!!!!')
  }
});



export default router;