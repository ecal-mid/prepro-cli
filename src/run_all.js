/* eslint-disable no-unused-vars */
const colors = require('colors');
/* eslint-enable no-unused-vars */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const {exec} = require('child_process');

const config = require('./config');
const {getVideoInfo} = require('./utils');

let outputFolder_;

function ensurePath(path) {
  if (!fs.existsSync(path)) {
    mkdirp.sync(path);
  }
  return path;
}

function video2kfvideo(inputFile, outputFile, cfg) {
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

function run(args) {
  const location = args.service.indexOf('remote') > -1 ? 'remote' : 'local';
  const log = args.log || `Running ${args.service}`;
  console.log('● '.bold.blue, `[${location}]`.bold, log);
  const service = require('./' + path.join('services', args.service));
  // type of output
  let type;
  if (args.output.indexOf('.') == -1) {
    ensurePath(args.output);
    type = 'frames';
  } else {
    const folder = args.output.split('/');
    folder.pop();
    ensurePath(path.join.apply(null, folder));
    type = args.output.split('.').pop();
  }
  // save infos
  cfg.video.services.push({
    'name': args.service.split(2).pop(),
    'path': path.relative(outputFolder_, args.output),
    'type': type,
  });
  return service(args.input, args.output, cfg);
}

function logVideoInfo(info) {
  console.log(`Width:         ${(info.width + 'px').bold.blue}`);
  console.log(`Height:        ${(info.height + 'px').bold.blue}`);
  console.log(`Duration:      ${(info.duration.toFixed(2) + 's').bold.blue}`);
  console.log(
      `Framerate:     ${(info.framerate.toFixed(2) + 'fps').bold.blue}`);
  console.log(`Total frames:  ${(info.totalframes + '').bold.blue}`);
  console.log('');
}

const runAll = (inputFile, outputFolder, params) => {
  outputFolder_ = outputFolder;

  cfg = config(params.config);
  console.log(`Config file:   ${params.config.bold.blue}`);
  console.log(`Remote url:    ${cfg.host.bold.blue}`);
  console.log(`Running on:    ${inputFile.bold.blue}`);

  servicesFolder = ensurePath(path.join(outputFolder, 'services'));

  // return pipeline Promise
  return getVideoInfo(inputFile)
      .then((infos) => {
        const videoInfos = infos.streams.filter((f) => f.codec_type == 'video');
        cfg.video = {
          duration: parseFloat(videoInfos[0]['duration']),
          framerate: parseFloat(videoInfos[0]['r_frame_rate']),
          totalframes: parseInt(videoInfos[0]['nb_frames']),
          width: parseInt(videoInfos[0]['width']),
          height: parseInt(videoInfos[0]['height']),
          services: [],
        };
        logVideoInfo(cfg.video);
      })
      // Video to Frames
      .then(() => {
        return run({
          service: 'video2frames',
          input: inputFile,
          output: path.join(servicesFolder, 'frames'),
          cfg: cfg,
          log: 'Extracting frames',
        });
      })
      // Video to Audio
      .then(() => {
        return run({
          service: 'video2audio',
          input: inputFile,
          output: path.join(servicesFolder, 'audio', 'mono.wav'),
          cfg: cfg,
          log: 'Extracting audio',
        });
      })
      // // Frames to color
      .then(() => {
        return run({
          service: 'frames2colors',
          input: path.join(servicesFolder, 'frames'),
          output: path.join(servicesFolder, 'colors', 'colors.json'),
          cfg: cfg,
          log: 'Extracting colors',
        });
      })
      // Audio to Spectrogram
      .then(() => {
        return run({
          service: 'remote/audio2spectrogram',
          input: path.join(servicesFolder, 'audio', 'mono.wav'),
          output: path.join(servicesFolder, 'spectrogram', 'spectrogram.png'),
          cfg: cfg,
          log: 'Extracting Audio Spectrogram',
        });
      })
      // Video to Human Pose
      .then(() => {
        return run({
          service: 'remote/video2openpose',
          input: inputFile,
          output: path.join(servicesFolder, 'openpose', 'openpose.json'),
          cfg: cfg,
          log: 'Extracting Human Pose (this may take several minutes)',
        });
      })
      // Frames to Segmentation Masks
      .then(() => {
        return run({
          service: 'remote/image2segmentation',
          input: path.join(servicesFolder, 'frames'),
          output: path.join(servicesFolder, 'segmentation'),
          cfg: cfg,
          log: 'Extracting Segmentations',
        });
      })
      // Frames to Captions
      // .then(() => image2captions(frames, servicesFolder))
      .then(() => {
        console.log('\nExporting keyframed video..'.bold);
        const outputFile = path.join(outputFolder, 'source.mov');
        return video2kfvideo(inputFile, outputFile, cfg);
      })
      .then(() => {
        console.log('\nSaving summary:', '    prepro.json'.bold);
        const outputFile = path.join(outputFolder, 'prepro.json');
        const file = fs.createWriteStream(outputFile);
        file.write(JSON.stringify(cfg.video, null, 2));
        file.end();
      })
      .then(() => console.log('\n', '✓ Prepro Pipeline complete!\n'.bold.green))
      .catch((err) => {
        console.error('\n\n✖ Prepro ERROR\n'.bold.red);
        console.error(err.stack.red, '\n');
        process.exit(1);
      });
};

module.exports = runAll;
