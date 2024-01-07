// src/app.ts
import express3 from "express";

// src/routes/users.ts
import express from "express";
import sha1 from "sha1";
import axios from "axios";

// src/config/index.ts
var config = {
  appid: "wx6361298f0e180aa1",
  secret: "741d6da7a14325fa0f49bb07fc8ae41b"
};
var config_default = config;

// src/utils/index.ts
function sendResponse(options) {
  if (options.type === "Success") {
    return Promise.resolve({
      message: options.message ?? null,
      data: options.data ?? null,
      status: options.type
    });
  }
  return Promise.reject({
    message: options.message ?? "Failed",
    data: options.data ?? null,
    status: options.type
  });
}

// src/routes/users.ts
var router = express.Router();
var { appid, secret } = config_default;
router.post("/wx-user", async function(req, res, next) {
  const code = req.query.code;
  console.log("code:", code);
  const user_info = await getWxUser(code);
  console.log("============H5\u4E2A\u4EBA\u4FE1\u606F\u63A5\u53E3================");
  res.send({ status: "Success", message: "", data: { wx_token: "token_paidaxing", user_info } });
});
async function getWxUser(code) {
  const result = await userAccessTokenByCode(code);
  const access_token = result.data.access_token;
  const openid = result.data.openid;
  console.log("access_token", access_token);
  console.log("openid", openid);
  const userInfoData = await userInfoByAccessTokenAndOpenId(access_token, openid);
  console.log("userInfo:", userInfoData.data);
  return userInfoData;
}
router.get("/", async function(req, res, next) {
  const code = req.query.code;
  const result = await userAccessTokenByCode(code);
  const access_token = result.data.access_token;
  const openid = result.data.openid;
  const userInfoData = await userInfoByAccessTokenAndOpenId(access_token, openid);
  console.log("userInfo:", userInfoData.data);
  res.send(userInfoData.data);
});
async function userAccessTokenByCode(code) {
  try {
    var access_token_url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;
    let access_token_data = await axios.get(access_token_url);
    console.log("access_token_data", access_token_data);
    let access_token = access_token_data.data.access_token;
    let openid = access_token_data.data.openid;
    let user_info_url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
    console.log("user_info_url", user_info_url);
    return sendResponse({
      type: "Success",
      data: access_token_data.data
    });
  } catch (error) {
    console.error("Error fetching access token:", error);
    return sendResponse({
      type: "Fail",
      message: error.message ?? "Failed"
    });
  }
}
async function userInfoByAccessTokenAndOpenId(access_token, openid) {
  console.log(access_token, openid);
  let user_info_url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
  console.log("\u83B7\u53D6\u7528\u6237\u7684\u8BF7\u6C42\u5730\u5740:", user_info_url);
  let result = axios.get(user_info_url);
  return result;
}
router.get("/wx-auth", function(req, res, next) {
  let { signature, timestamp, nonce, echostr } = req.query;
  let token = "paidaxing";
  let array = [timestamp, nonce, token];
  array.sort();
  let str = array.join("");
  let resultStr = sha1(str);
  if (resultStr === signature) {
    res.set("Content-Type", "text/plain");
    res.send(echostr);
  } else {
    res.send("Error!!!!!!");
  }
});
var users_default = router;

// src/routes/chatgpt/index.ts
import express2 from "express";

// src/chatgpt/index.ts
import * as dotenv from "dotenv";
import "isomorphic-fetch";
import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from "chatgpt";
import { SocksProxyAgent } from "socks-proxy-agent";
import httpsProxyAgent from "https-proxy-agent";
import fetch from "node-fetch";

// src/utils/is.ts
function isNotEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

// src/chatgpt/index.ts
var { HttpsProxyAgent } = httpsProxyAgent;
dotenv.config();
var ErrorCodeMessage = {
  401: "[OpenAI] \u63D0\u4F9B\u9519\u8BEF\u7684API\u5BC6\u94A5 | Incorrect API key provided",
  403: "[OpenAI] \u670D\u52A1\u5668\u62D2\u7EDD\u8BBF\u95EE\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5 | Server refused to access, please try again later",
  502: "[OpenAI] \u9519\u8BEF\u7684\u7F51\u5173 |  Bad Gateway",
  503: "[OpenAI] \u670D\u52A1\u5668\u7E41\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5 | Server is busy, please try again later",
  504: "[OpenAI] \u7F51\u5173\u8D85\u65F6 | Gateway Time-out",
  500: "[OpenAI] \u670D\u52A1\u5668\u7E41\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5 | Internal Server Error"
};
var timeoutMs = !isNaN(+process.env.TIMEOUT_MS) ? +process.env.TIMEOUT_MS : 100 * 1e3;
var disableDebug = process.env.OPENAI_API_DISABLE_DEBUG === "true";
var apiModel;
var model = isNotEmptyString(process.env.OPENAI_API_MODEL) ? process.env.OPENAI_API_MODEL : "gpt-3.5-turbo";
if (!isNotEmptyString(process.env.OPENAI_API_KEY) && !isNotEmptyString(process.env.OPENAI_ACCESS_TOKEN))
  throw new Error("Missing OPENAI_API_KEY or OPENAI_ACCESS_TOKEN environment variable");
var api;
(async () => {
  if (isNotEmptyString(process.env.OPENAI_API_KEY)) {
    const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL;
    const options = {
      apiKey: process.env.OPENAI_API_KEY,
      completionParams: { model },
      debug: !disableDebug
    };
    if (model.toLowerCase().includes("gpt-4")) {
      if (model.toLowerCase().includes("32k")) {
        options.maxModelTokens = 32768;
        options.maxResponseTokens = 8192;
      } else {
        options.maxModelTokens = 8192;
        options.maxResponseTokens = 2048;
      }
    }
    if (isNotEmptyString(OPENAI_API_BASE_URL))
      options.apiBaseUrl = `${OPENAI_API_BASE_URL}/v1`;
    setupProxy(options);
    api = new ChatGPTAPI({ ...options });
    apiModel = "ChatGPTAPI";
  } else {
    const options = {
      accessToken: process.env.OPENAI_ACCESS_TOKEN,
      apiReverseProxyUrl: isNotEmptyString(process.env.API_REVERSE_PROXY) ? process.env.API_REVERSE_PROXY : "https://ai.fakeopen.com/api/conversation",
      model,
      debug: !disableDebug
    };
    setupProxy(options);
    api = new ChatGPTUnofficialProxyAPI({ ...options });
    apiModel = "ChatGPTUnofficialProxyAPI";
  }
})();
async function chatReplyProcess(options) {
  const { message, lastContext, process: process2, systemMessage, temperature, top_p } = options;
  try {
    let options2 = { timeoutMs };
    if (apiModel === "ChatGPTAPI") {
      if (isNotEmptyString(systemMessage))
        options2.systemMessage = systemMessage;
      options2.completionParams = { model, temperature, top_p };
    }
    if (lastContext != null) {
      if (apiModel === "ChatGPTAPI")
        options2.parentMessageId = lastContext.parentMessageId;
      else
        options2 = { ...lastContext };
    }
    const response = await api.sendMessage(message, {
      ...options2,
      onProgress: (partialResponse) => {
        process2?.(partialResponse);
      }
    });
    return sendResponse({ type: "Success", data: response });
  } catch (error) {
    const code = error.statusCode;
    global.console.log(error);
    if (Reflect.has(ErrorCodeMessage, code))
      return sendResponse({ type: "Fail", message: ErrorCodeMessage[code] });
    return sendResponse({ type: "Fail", message: error.message ?? "Please check the back-end console" });
  }
}
function setupProxy(options) {
  if (isNotEmptyString(process.env.SOCKS_PROXY_HOST) && isNotEmptyString(process.env.SOCKS_PROXY_PORT)) {
    const agent = new SocksProxyAgent({
      hostname: process.env.SOCKS_PROXY_HOST,
      port: process.env.SOCKS_PROXY_PORT,
      userId: isNotEmptyString(process.env.SOCKS_PROXY_USERNAME) ? process.env.SOCKS_PROXY_USERNAME : void 0,
      password: isNotEmptyString(process.env.SOCKS_PROXY_PASSWORD) ? process.env.SOCKS_PROXY_PASSWORD : void 0
    });
    options.fetch = (url, options2) => {
      return fetch(url, { agent, ...options2 });
    };
  } else if (isNotEmptyString(process.env.HTTPS_PROXY) || isNotEmptyString(process.env.ALL_PROXY)) {
    const httpsProxy = process.env.HTTPS_PROXY || process.env.ALL_PROXY;
    if (httpsProxy) {
      const agent = new HttpsProxyAgent(httpsProxy);
      options.fetch = (url, options2) => {
        return fetch(url, { agent, ...options2 });
      };
    }
  } else {
    options.fetch = (url, options2) => {
      return fetch(url, { ...options2 });
    };
  }
}

// src/chatgpt/middleware/auth.ts
var auth = async (req, res, next) => {
  const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY;
  if (isNotEmptyString(AUTH_SECRET_KEY)) {
    try {
      const Authorization = req.header("Authorization");
      if (!Authorization || Authorization.replace("Bearer ", "").trim() !== AUTH_SECRET_KEY.trim())
        throw new Error("Error: \u65E0\u8BBF\u95EE\u6743\u9650 | No access rights");
      next();
    } catch (error) {
      res.send({ status: "Unauthorized", message: error.message ?? "Please authenticate.", data: null });
    }
  } else {
    next();
  }
};

// src/chatgpt/middleware/limiter.ts
import { rateLimit } from "express-rate-limit";
var MAX_REQUEST_PER_HOUR = process.env.MAX_REQUEST_PER_HOUR;
var maxCount = isNotEmptyString(MAX_REQUEST_PER_HOUR) && !isNaN(Number(MAX_REQUEST_PER_HOUR)) ? parseInt(MAX_REQUEST_PER_HOUR) : 0;
var limiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // Maximum number of accesses within an hour
  max: maxCount,
  statusCode: 200,
  // 200 means success，but the message is 'Too many request from this IP in 1 hour'
  message: async (req, res) => {
    res.send({ status: "Fail", message: "Too many request from this IP in 1 hour", data: null });
  }
});

// src/routes/chatgpt/index.ts
var router2 = express2.Router();
router2.post("/chat-process", [auth, limiter], async (req, res) => {
  res.setHeader("Content-type", "application/octet-stream");
  try {
    const { prompt, options = {}, systemMessage, temperature, top_p } = req.body;
    let firstChunk = true;
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat) => {
        res.write(firstChunk ? JSON.stringify(chat) : `
${JSON.stringify(chat)}`);
        firstChunk = false;
      },
      systemMessage,
      temperature,
      top_p
    });
  } catch (error) {
    res.write(JSON.stringify(error));
  } finally {
    res.end();
  }
});
var chatgpt_default = router2;

// src/app.ts
var app = express3();
app.use(express3.json());
var router3 = express3.Router();
var port = 3003;
app.use("/users", users_default);
app.use("/chat", chatgpt_default);
app.get("/", (req, res) => {
  res.send("Hello, TypeScript Express!");
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
//# sourceMappingURL=app.mjs.map