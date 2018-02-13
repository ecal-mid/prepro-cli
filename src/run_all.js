const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const colors = require('colors');
const {exec} = require('child_process');

const video2frames = require('./services/video2frames');
const video2audio = require('./services/video2audio');
const audio2spectrogram = require('./services/remote/audio2spectrogram');
const frames2colors = require('./services/frames2colors');
// const image2captions = require('./services/image2captions');

function ensurePath(path) {
  if (!fs.existsSync(path)) {
    mkdirp.sync(path);
  }
  return path;
}

const runAll = (inputFile, outputFolder) => {
  console.log(`Running prepro on ${inputFile.underline}`.bold);
  const frames = path.join(outputFolder, 'frames');
  new Promise((resolve) => resolve())
      // Video > Frames
      .then(() => {
        console.log('➜ '.bold.blue, 'Extracting Frames'.white);
        return video2frames(inputFile, outputFolder);
      })
      .then(() => {
        console.log('➜ '.bold.blue, 'Extracting Colors'.white);
        const folder = path.join(outputFolder, 'colors');
        return frames2colors(frames, ensurePath(folder));
      })
      // Video > Audio
      .then(() => {
        console.log('➜ '.bold.blue, 'Extracting Audio');
        return video2audio(inputFile, outputFolder);
      })
      // Audio > Spectrogram
      .then((audioFile) => {
        console.log('➜ '.bold.blue, 'Extracting Audio Spectrogram');
        const folder = path.join(outputFolder, 'spectrogram');
        const outputFile = path.join(ensurePath(folder), 'spectrogram.png');
        return audio2spectrogram(audioFile, outputFile);
      })
      .then(() => image2captions(frames, outputFolder))
      .then(() => console.log('✓ Prepro Pipeline complete!'.bold.green))
      .catch((err) => {
        console.error('✖ Prepro Local Run ERROR'.bold.red);
        console.error(err);
        process.exit(1);
      });
};

module.exports = runAll;
