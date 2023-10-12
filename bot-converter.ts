import { Context, Telegraf } from 'telegraf';
import { downloadTelegram } from './helper/function';
const { si } = require('nyaapi')
var subsrt = require('subsrt');
var fs = require('fs');


interface MyContext extends Context {
    myProp?: string;
    myOtherProp?: number;
}

const bot = new Telegraf<MyContext>(
    '5490513915:AAFBMetUG1u2Jk3yyw2D8K0CJKeRjQpoVLo',
    { handlerTimeout: 900000 }
);

bot.start((ctx) => ctx.reply('Кидайте субтитри форматі ass'));

bot.on('document', async (ctx) => {
    if (ctx.message.document) {
        console.log(ctx.message);

        if (ctx.message.document.mime_type == "text/x-ssa") {
            ctx.telegram
                .getFileLink(ctx.message.document.file_id)
                .then((url) => {
                    downloadTelegram(url, ctx.message.document.file_name).then((response) => {
                        var ass = fs.readFileSync(response, 'utf8');
                        ass = ass.replace(/{/g, '[').replace(/}/g, ']');
                        var srt = `9999
00:00:00,520 --> 00:00:00,990
...

`
                            + subsrt.convert(ass, { format: 'srt' });
                        //Write content to .sbv file
                        fs.writeFileSync(`./out/${ctx.message.document.file_name?.split('.')[0]}.srt`, srt);

                        ctx.telegram.sendDocument(ctx.from.id, {
                            source: `./out/${ctx.message.document.file_name?.split('.')[0]}.srt`,
                            filename: `${ctx.message.document.file_name?.split('.')[0]}.srt`
                        }).catch(function (error) { console.log(error); })
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }
});

// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
    return next();
});

bot.launch();
