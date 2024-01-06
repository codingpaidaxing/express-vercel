// src/app.ts
import express2 from "express";

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
  console.log("============H5\u4E2A\u4EBA\u4FE1\u606F\u63A5\u53E3================");
  res.send({ status: "Success", message: "", data: { wx_token: "token_paidaxing", user_info: { nickname: "paidaxing" } } });
});
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

// src/app.ts
var app = express2();
var router2 = express2.Router();
var port = 3002;
app.use("/users", users_default);
app.get("/", (req, res) => {
  res.send("Hello, TypeScript Express!");
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
//# sourceMappingURL=app.mjs.map