import puppeteer from 'puppeteer';
const axios = require('axios');
const fs = require('fs');
var randomstring = require('randomstring');
var Client = require('node-torrent');
var client = new Client({ logLevel: 'DEBUG' });
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function findFileByExt(folderPath: string, ext: string) {
  var files = fs.readdirSync(folderPath);
  var result: string[] = [];

  files.forEach(function (file: any) {
    var newbase: string = path.join(folderPath, file);
    // if (fs.statSync(newbase).isDirectory()) {
    //   result = findFileByExt(newbase, ext, fs.readdirSync(newbase), result);
    // } else {
    if (file.substr(-1 * (ext.length + 1)) == '.' + ext) {
      result.push(newbase);
    }
    //}
  });

  return result;
}

const logger = console;

const options = {
  timeout: 600000, // seconds
  logger,
};

export async function runStart(fileInput: string) {
  await new Promise((resolve, reject) => {
    ffmpeg(fs.createReadStream(fileInput), options)
      .on('end', () => {
        resolve('done');
      })
      .on('error', (progress: any) => {
        reject(new Error('mkv немає субтитрів'));
      })
      .noAudio()
      .noVideo()
      .output('./temp.ass')
      .run();
  });

  const filePath = `./video/${randomstring.generate()}.mp4`;

  await new Promise((resolve, reject) => {
    ffmpeg(fs.createReadStream(fileInput), options)
      .output(filePath, { end: true })
      .videoCodec('libx265')
      .addOptions(['-crf 27', '-preset superfast', '-vf subtitles=./temp.ass'])
      .size('1920x?')
      .on('end', () => {
        console.log('Finished processing'), resolve('done');
      })
      .on('progress', (progress: any) => {
        console.log(progress);
      })
      .run();
  });

  return await getLink(filePath);
}

function checkExistsWithTimeout(
  filePath: string,
  timeout: number
): Promise<boolean> {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      watcher.close();
      reject(
        new Error('File did not exists and was not created during the timeout.')
      );
    }, timeout);

    fs.access(filePath, fs.constants.R_OK, function (err: any) {
      if (!err) {
        clearTimeout(timer);
        watcher.close();
        resolve(true);
      }
    });

    var dir = path.dirname(filePath);
    var basename = path.basename(filePath);
    var watcher = fs.watch(dir, function (eventType: any, filename: any) {
      if (eventType === 'rename' && filename === basename) {
        clearTimeout(timer);
        watcher.close();
        resolve(true);
      }
    });
  });
}

function moveFile(fromPath: string, toPath: string) {
  return new Promise(function (resolve, reject) {
    fs.rename(fromPath, toPath, function (err: any) {
      if (err) {
        reject(new Error('File did not move.'));
        throw err;
      } else {
        console.log('File moved');
        resolve(true);
      }
    });
  });
}

export async function getLink(filePath: string): Promise<string> {
  const browser = await puppeteer.launch({ headless: true, slowMo: 250 });
  const page = await browser.newPage();
  await page.goto('https://dropmefiles.com/', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click("[id='browse_btn_x']"),
  ]);

  await fileChooser.accept([filePath]);

  await sleep(3000);

  const link = await (
    await page.$('div.link')
  )?.$eval('a.url', (node: any) => node.getAttribute('href'));

  await page.waitFor(
    () => {
      const element = document.querySelector('div.percent');
      return element && element.textContent === 'загружено';
    },
    { timeout: 36000 }
  );

  await browser.close();

  return link;
}

export async function downloadTelegram(url: any, ext = 'torrent') {
  return axios({ url: url.href, responseType: 'stream' }).then(
    (response: any) => {
      return new Promise((resolve, reject) => {
        const name = `${randomstring.generate()}.${ext}`;
        response.data
          .pipe(fs.createWriteStream('./output/' + name))
          .on('finish', () => resolve(name))
          .on('error', (e: any) => {});
      });
    }
  );
}

export function downloadFromTorrent(fileTorrent: string) {
  console.log(fileTorrent);
  var torrent = client.addTorrent(process.cwd() + '/output/' + fileTorrent);

  // when the torrent completes, move it's files to another area
  torrent.on('complete', function () {
    console.log('complete!');
    torrent.files.forEach(function (file: any) {
      var newPath = `${process.cwd()}/torrent/` + file.path;
      fs.rename(file.path, newPath);
      // while still seeding need to make sure file.path points to the right place
      file.path = newPath;
    });
  });
}

export async function downloadDropFiles(url: string, tempFolder: number) {
  fs.rmSync(`./downloads/${tempFolder}/`, { recursive: true, force: true });

  const browser = await puppeteer.launch({ headless: true, slowMo: 250 });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  //@ts-ignore
  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: `./downloads/${tempFolder}/`,
  });

  await page.click('.download_btn');

  sleep(2000);

  const files = findFileByExt(`./downloads/${tempFolder}/`, 'crdownload');

  await Promise.all(
    files.map((file) =>
      checkExistsWithTimeout(file.replace('.crdownload', ''), 990000)
    )
  );

  //console.log(findFileByExt('./downloads/temp/', 'crdownload'));
  let filemove: string = '';

  if (!fs.existsSync('./downloads/user')) {
    fs.mkdirSync('./downloads/user');
  }

  files.forEach((file) => {
    console.log(file);
    filemove =
      `downloads/user/${tempFolder}` +
      randomstring.generate() +
      '.' +
      file.replace('.crdownload', '').split('.').pop();

    moveFile(
      process.cwd() + '/' + file.replace('.crdownload', ''),
      process.cwd() + '/' + filemove
    );
  });

  fs.rmSync(`./downloads/${tempFolder}/`, { recursive: true, force: true });

  await browser.close();
  if (filemove && filemove.split('.').pop() == 'mkv') {
    return filemove;
  } else {
    return null;
  }
}
