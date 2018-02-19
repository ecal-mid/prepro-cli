const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

const video2frames = (inputFile, outputFolder, cfg) => {
  return new Promise((resolve, reject) => {
    let framesOutputFolder = path.join(outputFolder, 'frames');
    if (!fs.existsSync(framesOutputFolder)) {
      fs.mkdirSync(framesOutputFolder);
    }
    const cmd = [
      'ffmpeg',
      '-loglevel warning',
      `-i ${inputFile}`,
      `-r ${cfg.video.framerate}`,
      path.join(framesOutputFolder, 'frame-%03d.png'),
    ];
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

module.exports = video2frames;
