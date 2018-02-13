const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');
const {getDockerCmd} = require('./utils');

const video2audio = (inputFile, outputFolder) => {
  return new Promise((resolve, reject) => {
    console.log('Extracting audio file...');
    let audioOutputFolder = path.join(outputFolder, 'audio');
    if (!fs.existsSync(audioOutputFolder)) {
      fs.mkdirSync(audioOutputFolder);
    }
    const workingDir = process.cwd();
    const outputFile = path.join(audioOutputFolder, 'mono.wav');
    const cmd = getDockerCmd(inputFile, outputFolder, '/tmp/ffmpeg').concat([
      'opencoconut/ffmpeg',
      `-i ${inputFile}`,
      '-y',     // allow overwrite
      '-ac 1',  // combine to mono channel
      outputFile,
    ]);
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Done');
      resolve(outputFile);
    });
  });
};

module.exports = video2audio;
