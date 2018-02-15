const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const colors = require('colors');
const {exec} = require('child_process');

const config = require('./config');

const video2frames = require('./services/video2frames');
const video2audio = require('./services/video2audio');
const audio2spectrogram = require('./services/remote/audio2spectrogram');
const frames2colors = require('./services/frames2colors');
const video2openpose = require('./services/remote/video2openpose');
// const image2captions = require('./services/image2captions');

function ensurePath(path) {
  if (!fs.existsSync(path)) {
    mkdirp.sync(path);
  }
  return path;
}

const runAll = (inputFile, outputFolder, params) => {
  console.log(`Loading config file:    ${params.config.bold.underline}`);
  const cfg = config(params.config);
  console.log(`Remote tasks url:       ${cfg.host.bold.underline}`);
  console.log(`Running on:             ${inputFile.bold.underline}`);
  console.log('-'.bold.blue);
  const frames = path.join(outputFolder, 'frames');
  new Promise((resolve) => resolve())
      // Video to Frames
      .then(() => {
        console.log('● '.bold.blue, '[local]'.bold, 'Extracting Frames'.white);
        return video2frames(inputFile, outputFolder);
      })
      .then(() => {
        console.log('● '.bold.blue, '[local]'.bold, 'Extracting Colors'.white);
        const folder = path.join(outputFolder, 'colors');
        return frames2colors(frames, ensurePath(folder));
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
      // Frames to Captions
      // .then(() => image2captions(frames, outputFolder))
      .then(() => console.log('✓ Prepro Pipeline complete!'.bold.green))
      .catch((err) => {
        console.error('✖ Prepro Local Run ERROR'.bold.red);
        console.error(err);
        process.exit(1);
      });
};

module.exports = runAll;
