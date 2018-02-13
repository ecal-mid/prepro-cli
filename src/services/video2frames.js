const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

const video2frames = (inputFile, outputFolder) => {
  return new Promise((resolve, reject) => {
    let framesOutputFolder = path.join(outputFolder, 'frames');
    if (!fs.existsSync(framesOutputFolder)) {
      fs.mkdirSync(framesOutputFolder);
    }
    const workingDir = process.cwd();
    const cmd = [
      'ffmpeg',
      '-loglevel warning',
      `-i ${inputFile}`,
      `-qscale:v 2`,
      '-r 60',
      path.join(framesOutputFolder, 'frame-%03d.jpg'),
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
