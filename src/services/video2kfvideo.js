const {exec} = require('child_process');
const path = require('path');

const id = 'video2kfvideo';

const description = 'Reencode the input video with a keyframe for each frame';

let status = 'idle';

function getStatus() {
  return status;
}

const run = (inputFile, output, cfg) => {
  if (path.basename(output).indexOf('.') == '-1') {
    output = path.join(output, 'source.mov');
  }
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      `-i ${inputFile}`,
      // allow overwrite
      '-y',
      // codec
      '-c:v libx264',
      // codec options
      `-x264opts keyint=${cfg.video.framerate}`,
      output,
    ];
    status = 'processing';
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
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
