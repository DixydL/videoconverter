import { Context, Markup, Telegraf } from 'telegraf';
import { trim } from './helper/function';
const { si } = require('nyaapi')
var stringSimilarity = require("string-similarity");

var globalTunnel = require('global-tunnel-ng');

globalTunnel.initialize({
    host: '186.97.182.5',
    port: 999,
    // proxyAuth: 'userId:password', // optional authentication
    // sockets: 50 // optional pool size for each http and https
});


interface MyContext extends Context {
    myProp?: string;
    myOtherProp?: number;
}

const bot = new Telegraf<MyContext>(
    '5406259149:AAH24NRb2bAdQTq1Ec0SLOYzDWueAFmH0JA',
    { handlerTimeout: 900000 }
);

bot.start((ctx) => ctx.reply('Напишіть назву аніме'));

bot.on('text', async (ctx) => {
    let titles = await si.search("ASW " + ctx.message.text);

    if (!titles.length) {
        titles = await si.search("Erai-raws, " + ctx.message.text);
    }

    if (!titles.length) {
        titles = await si.search("Cleo, " + ctx.message.text);
    }

    if (!titles.length) {
        titles = await si.search(ctx.message.text);
    }

    const titlesName = titles.map((t: any) => trim(t.name))
    console.log(titles);
    var matches = {
        bestMatchIndex: 0,
    };

    try {
        matches = stringSimilarity.findBestMatch(ctx.message.text,
            titlesName
        );
    } catch (e) {
        //ctx.reply(`Незнайдено`);
    }

    if (!titles[matches.bestMatchIndex]) {
        ctx.reply(`Незнайдено`);
    } else {
        ctx.reply(`${titles[matches.bestMatchIndex].name}`, Markup.inlineKeyboard(
            [
                Markup.button.url("Magnet(soon)", titles[matches.bestMatchIndex].torrent),
                Markup.button.url("Torrent", titles[matches.bestMatchIndex].torrent
                ),
            ],
            { columns: 1 }
        ));
    }
});

// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
    return next();
});

bot.launch();
