const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
var path = require('path');
import { findFileByExt, runStart } from './helper/function';

(async () => {
  const files = findFileByExt(`./input/`, 'mkv');
  for (const file of files) {
    const link = await runStart(file, path.basename(file)).catch(() => {
        console.log("error");
    });
  }
})();
