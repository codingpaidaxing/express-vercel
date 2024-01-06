// src/app.ts
import express, { Request, Response } from 'express';
import { isNotEmptyString } from './utils/is'
import usersRouter from './routes/users';
import chatRouter from './routes/chatgpt/index';


const app = express();
// 文件中正确使用了 express.json() 中间件来解析请求体 不配置这个可能会无法获取 req.body
app.use(express.json());
const router = express.Router()

const port = 3003;

// app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/chat', chatRouter);


app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript Express!');
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
