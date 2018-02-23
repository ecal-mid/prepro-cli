const {exec} = require('child_process');
const path = require('path');

const id = 'video2audio';

const description = 'Extract mono audio track from video';

let status = 'idle';

function getStatus() {
  return status;
}

const run = (inputFile, output, cfg) => {
  if (path.basename(output).indexOf('.') == '-1') {
    output = path.join(output, 'mono.wav');
  }
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      `-i ${inputFile}`,
      // allow overwrite
      '-y',
      // combine to mono channel
      '-ac 1',
      output,
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
