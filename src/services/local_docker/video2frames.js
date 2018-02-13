const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');
const {getDockerCmd} = require('./utils');

const video2frames = (inputFile, outputFolder) => {
  return new Promise((resolve, reject) => {
    console.log('Extracting frames...');
    let framesOutputFolder = path.join(outputFolder, 'frames');
    if (!fs.existsSync(framesOutputFolder)) {
      fs.mkdirSync(framesOutputFolder);
    }
    const workingDir = process.cwd();
    const cmd = getDockerCmd(inputFile, outputFolder, '/tmp/ffmpeg').concat([
      'opencoconut/ffmpeg',
      '-loglevel warning',
      `-i ${inputFile}`,
      `-qscale:v 2`,
      '-r 60',
      path.join(framesOutputFolder, 'frame-%03d.jpg'),
    ]);
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Done');
      resolve();
    });
  });
};

module.exports = video2frames;
