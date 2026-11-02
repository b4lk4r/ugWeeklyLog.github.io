import {app} from './app';import {migrate} from './db';
await migrate();app.listen(Number(process.env.PORT||4180),process.env.HOST||'127.0.0.1',()=>console.log(`ЗРА: ${process.env.PUBLIC_ORIGIN}`));
