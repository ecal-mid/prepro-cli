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

const parseVideoInfo = (infos) => {
  const videoInfos = infos.streams.filter((f) => f.codec_type == 'video');
  return {
    duration: parseFloat(videoInfos[0]['duration']),
    framerate: parseFloat(eval(videoInfos[0]['r_frame_rate'])),
    totalframes: parseInt(videoInfos[0]['nb_frames']),
    width: parseInt(videoInfos[0]['width']),
    height: parseInt(videoInfos[0]['height']),
    size: infos.format.size / (1024 * 1024),
    services: [],
  };
};

const logVideoInfo = (info, format) => {
  const pad = (s) => '  ' + s.padEnd(13);
  console.log(pad('Format'), format.format_long_name);
  console.log(pad('Size'), info.size.toFixed(2) + 'mb');
  console.log(pad('Width'), info.width + 'px');
  console.log(pad('Height'), info.height + 'px');
  console.log(pad('Duration'), info.duration.toFixed(2) + 's');
  console.log(pad('Framerate'), info.framerate.toFixed(2) + 'fps');
  console.log(pad('Total frames'), info.totalframes + '');
  console.log('');
};

const compileFrames = (inputFolder, output, cfg, quality) => {
  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      '-loglevel warning',
      `-r ${cfg.video.framerate}`,
      `-i ${path.dirname(output)}/frame-%04d.png`,
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
  logVideoInfo,
  parseVideoInfo,
  compileFrames,
};
