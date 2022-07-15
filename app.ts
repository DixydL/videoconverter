const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
import { Context, Telegraf } from 'telegraf';
import {
  downloadDropFiles,
  runStart,
} from './helper/function';

interface MyContext extends Context {
  myProp?: string;
  myOtherProp?: number;
}

const bot = new Telegraf<MyContext>(
  '5368876346:AAFtaHbgKt7ME0kPT7-owgujKX1r0kT1HRg',
  { handlerTimeout: 900000 }
);

bot.start((ctx) => ctx.reply('Скиньте файл'));

// bot.on('document', (ctx) => {
//   console.log(ctx.message);

//   ctx.telegram
//     .getFileLink(ctx.message.document.file_id)
//     .then((url) => {
//       downloadTelegram(url).then((response) => {
//         //downloadFromTorrent(response);
//       });
//     })
//     .catch((err) => {
//       console.log(err);
//     });
//   // Explicit usage
//   ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`);

//   // Using context shortcut
//   ctx.reply(`Hello ${ctx.state.role}`);
// });

bot.on('text', async (ctx) => {
  ctx.reply(`Відео завантажується з fex`);

  console.log(ctx.message);

  try {
    (async () => {
      const file = await downloadDropFiles(
        ctx.message.text,
        ctx.message.message_id
      ).catch((err) => {
        console.log(err);
      });

      ctx.reply(`Почалося кодування відео це займе деякий час`);


      if (!file) {
        throw Error('error');
      }

      const link = await runStart(file).catch(() => {
        ctx.reply('mkv немає субтитрів');
      });

      ctx.reply(`Успішно, посилання на файл: ${link} `);
    })().catch(() => {
      ctx.reply('Сталася помилка спробуйте ще раз');
    });
  } catch (err) {
    console.log(err);
    ctx.reply('Сталася помилка спробуйте ще раз');
  }

  // Using context shortcut
});

// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
  return next();
});

bot.launch();
