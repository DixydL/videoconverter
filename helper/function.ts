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

export function findFileByExt(folderPath: string, ext: string) {
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

export async function runStart(
  fileInput: string,
  nameFile: string = "test.mkv",
  sub = false
) {
  let args = ['-crf 26', '-preset fast'];

  const [filename, ext] = nameFile.split('.');

  sub = await new Promise((resolve, reject) => {
    ffmpeg(fs.createReadStream(fileInput), options)
      .on('end', () => {
        resolve(true);
      })
      .on('error', (progress: any) => {
        console.log(progress);
        resolve(false);
      })
      .noAudio()
      .noVideo()
      .output('./temp.ass')
      .run();
  });

  if (sub) {
    args.push('-vf subtitles=./temp.ass');
  }

  const filePath = `./output/${filename}[InariDuB].mp4`;

  await new Promise((resolve, reject) => {
    ffmpeg(fs.createReadStream(fileInput), options)
      .output(filePath, { end: true })
      .videoCodec('libx264')
      .addOptions(args)
      .size('1920x?')
      .on('end', () => {
        console.log('Finished processing'), resolve('done');
      })
      .on('error', (progress: any) => {
        console.log(progress);

        reject(new Error('mkv немає субтитрів'));
      })
      .on('progress', (progress: any) => {
        console.log(progress);
      })
      .run();
  });

  return filePath;
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
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 250,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('https://fex.net/uk/a', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  await page.click(
    'button.button.button_theme_primary.button_type_cookies-policy-notification'
  );
  //await page.click('#root > div > div > div.dir-menu > div > div:nth-child(2) > div.dir-menu-controls__item.dir-menu-controls__item_type_upload > div > button');
  await sleep(3000);

  await page.waitForSelector('input[type=file]');
  const fileInput = await page.$('div > input[type=file]');
  await fileInput?.uploadFile(filePath);

  ///trigger event
  await fileInput?.evaluate((upload) =>
    upload.dispatchEvent(new Event('change', { bubbles: true }))
  );

  //   await page.focus('#root > div > div > div.layout__position-relative.container.container_width_primary.flex.flex_direction_col.flex__grow-1.margin_bottom_25.container_min-height_476 > div.drop-zone > div > span')
  //   const [fileChooser] = await Promise.all([
  //     page.waitForFileChooser(),
  //     page.tap(
  //       '#root > div > div > div.layout__position-relative.container.container_width_primary.flex.flex_direction_col.flex__grow-1.margin_bottom_25.container_min-height_476 > div.drop-zone > div > span',
  //     ),
  //   ]);

  //   await fileChooser.accept([filePath]);

  await sleep(3000);

  await page.waitFor(
    () => {
      const element = document.querySelector(
        'section > button.button.button_theme_primary.button_size_normal > span.button__text'
      );
      return element && element.textContent === 'Скопіювати посилання';
    },
    { timeout: 360000 }
  );

  const link = await (
    await page.$(
      'div.shared-link-box.shared-link-box_theme_secondary.color_background_1d1d1d.padding_all_10'
    )
  )?.$eval(
    'input.input.shared-link-box__hidden-field',
    (node: any) => node.value
  );

  console.log('успіх', link);

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

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 250,
    args: ['--no-sandbox'],
  });
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

  sleep(5000);

  const atrribute = await (
    await page.$(
      '#root > div > div > div.layout__position-relative.container.container_width_primary.flex.flex_direction_col.flex__grow-1.margin_bottom_25.container_min-height_476 > div > div > div:nth-child(2) > div > div > div > div.fs-table__item.fs-table__item_type_file.fs-table__item_type_adsense > div.fs-table__controls > div > div.node-controls__item.node-controls__item_type_download > div'
    )
  )?.$eval('button.button.button_type_node-control', (node: any) =>
    node.getAttribute('data-download-url')
  );

  console.log(atrribute);

  //   await page.waitForSelector(
  //     'div.node-controls__item.node-controls__item_type_download > div > button > span'
  //   );
  //   let button = await page.$(
  //     'div.node-controls__item.node-controls__item_type_download > div > button > span'
  //   );
  //await button?.evaluate((b: any) => b.click());

  const res = await page.evaluate((atrribute) => {
    return atrribute;
    return fetch(atrribute, {
      method: 'GET',
      credentials: 'include',
    }).then((r) => r.blob());
  }, atrribute);

  console.log(res);

  if (!fs.existsSync(`./downloads/${tempFolder}`)) {
    fs.mkdirSync(`./downloads/${tempFolder}`);
  }

  fs.createWriteStream(`./downloads/${tempFolder}/test.mkv`)
    .write(res.stream())
    .then(() => {
      console.log('done');
    });

  await sleep(25000);

  console.log(2);

  let files = findFileByExt(`./downloads/${tempFolder}/`, 'crdownload');
  if (files.length == 0) {
    files = findFileByExt(`./downloads/${tempFolder}/`, 'mkv');
  }
  console.log(files);
  await sleep(5000);

  await Promise.all(
    files.map((file) =>
      checkExistsWithTimeout(file.replace('.crdownload', ''), 990000)
    )
  );
  console.log(4);

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

    console.log(filemove);

    moveFile(process.cwd() + '/' + file, process.cwd() + '/' + filemove);
  });

  fs.rmSync(`./downloads/${tempFolder}/`, { recursive: true, force: true });

  await browser.close();
  if (filemove && filemove.split('.').pop() == 'mkv') {
    return filemove;
  } else {
    return null;
  }
}
