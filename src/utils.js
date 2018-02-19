const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

const getVideoInfo = (inputFile) => {
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffprobe',
      `-i ${inputFile}`,
      '-print_format json',
      '-show_format',
      '-show_streams',
    ];
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      const info = JSON.parse(stdout);
      resolve(info);
    });
  });
};

module.exports = {getVideoInfo};
