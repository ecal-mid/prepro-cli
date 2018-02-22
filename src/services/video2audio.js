const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

const video2audio = (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
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
