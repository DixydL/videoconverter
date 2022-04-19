const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
import { Context, Telegraf } from 'telegraf';
import { findFileByExt, runStart } from './helper/function';

(async () => {
  const files = findFileByExt(`./downloads/input/`, 'mkv');
  for (const file of files) {
    const link = await runStart(file).catch(() => {
        console.log("error");
    });
  }
})();
