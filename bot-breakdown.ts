import { Context, Telegraf } from "telegraf";
import { downloadTelegram } from "./helper/function";
var assParser = require("ass-parser");
var subsrt = require("subsrt");
var fs = require("fs");
import { parse, map, stringify, stringifySync, parseTimestamp } from "subtitle";

interface MyContext extends Context {
  myProp?: string;
  myOtherProp?: number;
}

const bot = new Telegraf<MyContext>(
  "5721216056:AAG54QzDUoI51d6Wj8hky-PAacpKIompaHM",
  { handlerTimeout: 900000 }
);

bot.start((ctx) => ctx.reply("Кидайте субтитри форматі ass"));

bot.on("document", async (ctx) => {
  if (ctx.message.document) {
    console.log(ctx.message);

    if (ctx.message.document.mime_type == "text/x-ssa") {
      ctx.telegram
        .getFileLink(ctx.message.document.file_id)
        .then((url) => {
          downloadTelegram(url, ctx.message.document.file_name).then(
            (response) => {
              var ass = fs.readFileSync(response, "utf8");

              const parsed = assParser(ass);

              const actors: any = {};
              for (const dialog of parsed[parsed.length - 1].body) {
                if (dialog.value && dialog.value.Style) {
                  if (actors[dialog.value.Style]) {
                    actors[dialog.value.Style].push({
                      type: "cue",
                      data: {
                        start: parseTimestamp(dialog.value.Start + "0"),
                        end: parseTimestamp(dialog.value.End + "0"),
                        text: dialog.value.Text,
                      },
                    });
                  } else {
                    actors[dialog.value.Style] = [];
                    console.log(dialog.value.Start + "0");
                    actors[dialog.value.Style].push({
                      type: "cue",
                      data: {
                        start: parseTimestamp(dialog.value.Start + "0"),
                        end: parseTimestamp(dialog.value.End + "0"),
                        text: dialog.value.Text,
                      },
                    });
                  }
                }
              }

              //   const input = fs.readFileSync("awesome-movie.srt", "utf8");

              for (const actor in actors) {
                fs.writeFileSync(
                  `./out/${
                    ctx.message.document.file_name?.split(".")[0]
                  }-${actor}.srt`,
                  stringifySync(actors[actor], { format: "SRT" })
                );

                ctx.telegram
                  .sendDocument(ctx.from.id, {
                    source: `./out/${
                      ctx.message.document.file_name?.split(".")[0]
                    }-${actor}.srt`,
                    filename: `${
                      ctx.message.document.file_name?.split(".")[0]
                    }-${actor}.srt`,
                  })
                  .catch(function (error) {
                    console.log(error);
                  });
              }

              console.log(actors);
            }
          );
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
