const {exec} = require('child_process');

const video2audio = (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      `-i ${inputFile}`,
      // allow overwrite
      '-y',
      // combine to mono channel
      '-ac 1',
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
