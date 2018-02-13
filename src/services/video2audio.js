const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

const video2audio = (inputFile, outputFolder) => {
  return new Promise((resolve, reject) => {
    let audioOutputFolder = path.join(outputFolder, 'audio');
    if (!fs.existsSync(audioOutputFolder)) {
      fs.mkdirSync(audioOutputFolder);
    }
    const outputFile = path.join(audioOutputFolder, 'mono.wav');
    const cmd = [
      'ffmpeg',
      `-i ${inputFile}`,
      '-y',     // allow overwrite
      '-ac 1',  // combine to mono channel
      outputFile,
    ];
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(outputFile);
    });
  });
};

module.exports = video2audio;
