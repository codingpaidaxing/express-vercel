import express from 'express'
import type { RequestProps } from '../../chatgpt/model'
import type { ChatMessage } from '../../chatgpt/index'
import { chatConfig, chatReplyProcess, currentModel } from '../../chatgpt/index'
import { auth } from '../../chatgpt/middleware/auth'
import { limiter } from '../../chatgpt/middleware/limiter'
import { isNotEmptyString } from '../../utils/is'

const router = express.Router()


router.post('/chat-process', [auth, limiter], async (req, res) => {
  // res.setHeader('Content-type', 'application/octet-stream')
  res.setHeader('Content-type', 'text/event-stream')
  // 在服务器端的响应头中设置 Cache-Control: no-cache 来确保不进行缓存。 确保浏览器和服务器没有对 SSE 请求进行缓存
  res.setHeader('Cache-Control', 'no-cache');


  try {
    const { prompt, options = {}, systemMessage, temperature, top_p } = req.body as RequestProps
    let firstChunk = true
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
      temperature,
      top_p,
    })
  }
  catch (error) {
    console.log('error:', error);
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

// router.post('/config', auth, async (req, res) => {
//   try {
//     const response = await chatConfig()
//     res.send(response)
//   }
//   catch (error) {
//     res.send(error)
//   }
// })

// router.post('/session', async (req, res) => {
//   try {
//     const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
//     const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
//     res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
//   }
//   catch (error) {
//     res.send({ status: 'Fail', message: error.message, data: null })
//   }
// })

// router.post('/verify', async (req, res) => {
//   try {
//     const { token } = req.body as { token: string }
//     if (!token)
//       throw new Error('Secret key is empty')

//     if (process.env.AUTH_SECRET_KEY !== token)
//       throw new Error('密钥无效 | Secret key is invalid')

//     res.send({ status: 'Success', message: 'Verify successfully', data: null })
//   }
//   catch (error) {
//     res.send({ status: 'Fail', message: error.message, data: null })
//   }
// })


export default router;