const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const colors = require('colors');
const {exec} = require('child_process');

const config = require('./config');
const {getVideoInfo} = require('./utils');

const video2frames = require('./services/video2frames');
const video2audio = require('./services/video2audio');
const audio2spectrogram = require('./services/remote/audio2spectrogram');
const frames2colors = require('./services/frames2colors');
const video2openpose = require('./services/remote/video2openpose');
const image2segmentation = require('./services/remote/image2segmentation');
// const image2captions = require('./services/image2captions');

function ensurePath(path) {
  if (!fs.existsSync(path)) {
    mkdirp.sync(path);
  }
  return path;
}

const runAll = (inputFile, outputFolder, params) => {
  const cfg = config(params.config);
  console.log(`Config file:       ${params.config.bold}`);
  console.log(`Remote tasks url:  ${cfg.host.bold}`);
  console.log(`Running on:        ${inputFile.bold}`);
  // return pipeline Promise
  return getVideoInfo(inputFile)
      .then((infos) => {
        const videoInfos = infos.streams.filter((f) => f.codec_type == 'video');
        cfg.video = {
          duration: parseFloat(videoInfos[0]['duration']).toFixed(2),
          framerate: parseFloat(videoInfos[0]['r_frame_rate']).toFixed(2),
          totalFrames: videoInfos[0]['nb_frames'],
        };
        console.log(`Video Duration:    ${(cfg.video.duration + 's').bold}`);
        console.log(`Video Framerate:   ${(cfg.video.framerate + 'fps').bold}`);
        console.log(`Total frames:      ${cfg.video.totalFrames.bold}`);
        console.log('');
      })
      // Video to Frames
      .then(() => {
        console.log('● '.bold.blue, '[local]'.bold, 'Extracting Frames'.white);
        return video2frames(inputFile, outputFolder, cfg);
      })
      .then(() => {
        console.log('● '.bold.blue, '[local]'.bold, 'Extracting Colors'.white);
        const folder = path.join(outputFolder, 'colors');
        const framesFolder = path.join(outputFolder, 'frames');
        return frames2colors(framesFolder, ensurePath(folder));
      })
      // Video to Audio
      .then(() => {
        console.log('● '.bold.blue, '[local]'.bold, 'Extracting Audio');
        return video2audio(inputFile, outputFolder);
      })
      // Audio to Spectrogram
      .then((audioFile) => {
        console.log(
            '● '.bold.blue, '[remote]'.bold, 'Extracting Audio Spectrogram');
        const folder = path.join(outputFolder, 'spectrogram');
        const outputFile = path.join(ensurePath(folder), 'spectrogram.png');
        return audio2spectrogram(audioFile, outputFile, cfg);
      })
      // Video to Human Pose
      .then(() => {
        console.log(
            '● '.bold.blue, '[remote]'.bold,
            'Extracting Human Pose (this may take several minutes)');
        const folder = path.join(outputFolder, 'openpose');
        const outputFile = path.join(ensurePath(folder), 'openpose.json');
        return video2openpose(inputFile, outputFile, cfg);
      })
      .then(() => {
        console.log(
            '● '.bold.blue, '[remote]'.bold,
            'Extracting Segmentations (this may take several minutes)');
        const folder = path.join(outputFolder, 'segmentation');
        const segFolder = ensurePath(folder);
        const framesFolder = path.join(outputFolder, 'frames');
        return image2segmentation(framesFolder, segFolder, cfg);
      })
      // Frames to Captions
      // .then(() => image2captions(frames, outputFolder))
      .then(() => console.log('\n✓ Prepro Pipeline complete!\n'.bold.green))
      .catch((err) => {
        console.error('\n', '✖ Prepro ERROR'.bold.red);
        console.error(err);
        process.exit(1);
      });
};

module.exports = runAll;
