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

const compileFrames = (inputFolder, output, cfg, quality) => {
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      '-loglevel warning',
      `-r ${cfg.video.framerate}`,
      `-i ${path.dirname(output)}/frame-%03d.png`,
      '-y',
      // codec
      '-c:v libx264',
      `-vf fps=${cfg.video.framerate}`,
      `-x264opts keyint=${cfg.video.framerate}`,
      '-pix_fmt yuv420p',
      `-crf ${quality}`,
      // codec options
      output,
    ];
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(output);
    });
  });
};

module.exports = {
  getVideoInfo,
  compileFrames,
};
