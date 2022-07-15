import CloudConvert from 'cloudconvert';
import { TelegramClient } from "telegram";
import { StoreSession, StringSession } from "telegram/sessions";
//@ts-ignore
import input from "input";
import { mergeMkv, trim } from './helper/function';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import path from 'path';
const fs = require('fs');
const https = require('https');
const { si, pantsu } = require('nyaapi')
const WebTorrent = require('webtorrent')
var stringSimilarity = require("string-similarity");

const api_key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjhlNWQyOGZiN2UzMjdlY2M4ODhiYmZlZThmZTJlM2QwNTA3MmM0NmE0NDE4MDgxYjQ2OWVjMWFlODRiMWVkNDBiYjU0MjI1NDM5ZTkyYWEiLCJpYXQiOjE2NTc1NTA1MjcuNDE3MjU1LCJuYmYiOjE2NTc1NTA1MjcuNDE3MjU2LCJleHAiOjQ4MTMyMjQxMjcuNDAzNDc4LCJzdWIiOiI1NzQxOTkxMiIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsIndlYmhvb2sud3JpdGUiLCJwcmVzZXQucmVhZCIsInByZXNldC53cml0ZSJdfQ.JKcQ7Reg01vadDpkOtygQIM8u5LyrcUyE-zLG6kAzjFTTbv0XTJK0Ib66EJknO9_XHwrBN4uYRThhENnVTOKHkQr7OixWDbj_JiAUSO0dzlaURhqDoSY2aqW-QtMX_m43qX79aY2ZpDESmE0XqFx6msNnMZrqe7PlmbNmbU-5n9Czi8OiJpCoELlKzbwEONyFQw7W6IaTEkOSfazGB1BwKTBCls6rZv25JO15AFfUvRS5Y64ur82I-NZ9_ozT4ulbXcAUjHOGoDlxthrwch0gPP0JuQPjpU0ScJWfleDMxE3bIwWHa1_UWzTdOe22HXOOr1bZS5W4IgFuTwYbCPuPIIS51ekFGwFpQtfFEw4GsdJiEWpaetLZuMA9-A6065jlZLklmSrJU8vfnVlcYJc-Tx8YSAoaQLTrb0PgQfSQ_qcdDcJsSeC4kiTMRlI4zgN_c3TIn5AQz3NmR6EWW3z0bOFBk6V0aGgSew0gdIqvYO9we8lHrriS4WJVI5eVCH-_gdwElPmoO-99HX9QuBn2PlLjNCR0eSR3S-5p_Z0i3z9MXVzvCc4GNhMoE_NbJyg4YBUMuzfznNVPRFdqZW9-n2emObGcJ3y7RrFIO64mgMHwPPjUeh6TxhrrJzVUUtgxqK_6YB-ZSfe6vexqJOyb-OjwjPZTboTuoAM1g9nVog";

const cloudConvert = new CloudConvert(api_key);

async function webTorentDownload(torrentId: string): Promise<string> {
  const client = new WebTorrent()

  return await new Promise((resolve, reject) => {
    client.add(torrentId, (torrent: any) => {
      const files = torrent.files
      let length = files.length
      // Stream each file to the disk
      files.forEach((file: any) => {
        const source = file.createReadStream()
        const destination = fs.createWriteStream("./torrent/" + file.name)
        source.on('end', () => {
          console.log('file:\t\t', file.name)
          // close after all files are saved
          length -= 1
          if (!length) return resolve("./torrent/" + file.name);
        }).pipe(destination)
      })
    })
  });
}

async function converter(uploadFile: string, subFile: string) {
  let job = await cloudConvert.jobs.create({
    "tasks": {
      "import-1": {
        "operation": "import/upload",
        //"url": ""
      },
      "import-2": {
        "operation": "import/upload",
        //"url": ""
      },
      "task-1": {
        "operation": "convert",
        "input_format": "mkv",
        "output_format": "mp4",
        "engine": "ffmpeg",
        "input": [
          "import-1"
        ],
        "video_codec": "x264",
        "crf": 25,
        "preset": "fast",
        "fit": "scale",
        "subtitles_mode": "hard",
        "subtitles": [
          "import-2"
        ],
        "watermark_position_vertical": "center",
        "watermark_position_horizontal": "center",
        "watermark_margin_vertical": 25,
        "watermark_margin_horizontal": 25,
        "audio_codec": "aac",
        "audio_bitrate": 128
      },
      "export-1": {
        "operation": "export/url",
        "input": [
          "task-1"
        ],
        "inline": false,
        "archive_multiple_files": false
      }
    },
    "tag": "jobbuilder"
  }).catch(e => {
    console.log(e);
  });

  if (!job) {
    return;
  }

  const uploadTask2 = job.tasks.filter(task => task.name === 'import-2')[0];
  console.log("subfile:" + subFile);
  const inputFile2 = fs.createReadStream(subFile);
  await cloudConvert.tasks.upload(uploadTask2, inputFile2, path.basename(subFile));

  const uploadTask = job.tasks.filter(task => task.name === 'import-1')[0];

  const inputFile = fs.createReadStream(uploadFile);
  await cloudConvert.tasks.upload(uploadTask, inputFile, path.basename(uploadFile));

  job = await cloudConvert.jobs.wait(job.id); // Wait for job completion

  const exportTask: any = job.tasks.filter(
    task => task.operation === 'export/url' && task.status === 'finished'
  )[0];

  const file = exportTask.result.files[0];

  const writeStream = fs.createWriteStream('./out/' + file.filename);

  https.get(file.url, function (response: any) {
    response.pipe(writeStream);
  });

  return await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve('./out/' + file.filename));
    writeStream.on('error', reject);
  });
}

async function test() {
  const apiId = 9392229;
  const apiHash = "d1d89e0ea5427607fb11848f2b0f798c";
  const storeSession = new StoreSession("session");

  (async () => {
    console.log("Loading interactive example...");
    const client = new TelegramClient(storeSession, apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.start({
      phoneNumber: async () => await input.text("Please enter your number: "),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err: Error) => console.log(err),
    });
    console.log("You should now be connected.");
    console.log(client.session.save()); // Save this string to avoid logging in again

    async function eventPrint(event: NewMessageEvent) {
      const message: any = event.message;

      const media: any = event.message.media;

      if (media) {
        // if (media.mimeType == "text/x-ssa") {
        //   await client.sendMessage("@videoConverter2", { message: "Субтитри прийняті!" });
        // } else {
        //   await client.sendMessage("@videoConverter2", { message: "Звук прийнятий!" });
        // }

      } else {
        if (message.text == "run") {
          const messages: any = await client.getMessages("@videoConverter2", { limit: 4 });
          if (!fs.existsSync(`./out/${message.fromId.userId.value}`)) {
            fs.mkdirSync(`./out/${message.fromId.userId.value}`);
          }

          if (messages) {
            const titles = await si.search("ASW " + messages[3].text);
            const titlesName = titles.map((t: any) => trim(t.name))
            console.log(titlesName);

            var matches = stringSimilarity.findBestMatch(messages[3].text,
              titlesName
            );

            console.log(matches);

            const fileName = await webTorentDownload(titles[matches.bestMatchIndex].magnet);
            const sound = await client.downloadMedia(messages[1].media, { outputFile: `./out/${messages[1].fromId.userId.value}/` + messages[1].media.document.attributes[1].fileName });

            const merged = await mergeMkv(fileName, sound as string);

            const sub = await client.downloadMedia(messages[2].media, { outputFile: `./out/${messages[2].fromId.userId.value}/` + messages[2].media.document.attributes[0].fileName });

            const out = await converter(merged, sub as string);
            //const out = "./out/[ASW] Isekai Meikyuu de Harem wo - 01 [1080p HEVC][FA67520E].mp4";
            console.log(out);

            await client.sendFile("@videoConverter2", {
              file: out as string,
            });

            console.log(out);
          }

          return;
        }

        return;
        const titles = await si.search("ASW " + event.message.text);

        console.log(titles[0]);
        const fileName = await webTorentDownload(titles[0].magnet);
        //await converter("./" + fileName);
        console.log("finish:" + fileName);
      }

      // Checks if it's a private message (from user or bot)
      if (event.isPrivate) {
        // prints sender id
        console.log(message.senderId);
        // read message
        if (message.text == "hello") {
          const sender = await message.getSender();
          console.log("sender is", sender);
          if (sender) {
            await client.sendMessage(sender, {
              message: `hi your id is ${message.senderId}`
            });
          }
        }
      }
    }

    client.addEventHandler(eventPrint, new NewMessage({
      fromUsers: [
        '@dixyd_chan',
        '@dixy_chan'
      ]
    }));
  })();
  //await mergeMkv('./file.mkv');
}

test();
//main();
