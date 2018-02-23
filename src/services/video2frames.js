const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

const id = 'video2frames';

const description = 'Extract frames from video';

let status = 'idle';

function getStatus() {
  return status;
}

const run = (inputFile, output, cfg) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output);
    }
    const cmd = [
      'ffmpeg',
      '-loglevel warning',
      `-i ${inputFile}`,
      `-r ${cfg.video.framerate}`,
      path.join(output, 'frame-%03d.png'),
    ];
    status = 'processing';
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
        status = 'error';
        reject(err);
        return;
      }
      status = 'complete';
      resolve(output);
    });
  });
};

module.exports = {
  id,
  description,
  run,
  getStatus,
};
