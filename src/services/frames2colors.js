const fs = require('fs');
const path = require('path');
const getColors = require('get-image-colors');

const image2colors = (inputFile) => {
  return getColors(inputFile);
};

const frames2colors = (inputFolder, outputFile) => {
  return new Promise((resolve, reject) => {
    const frames = fs.readdirSync(inputFolder);
    const promises = [];
    for (let f of frames) {
      const filename = path.join(inputFolder, f);
      promises.push(image2colors(filename));
    }
    Promise.all(promises)
        .then((values) => {
          const result = [];
          for (let i = 0; i < values.length; i++) {
            const v = values[i];
            result[i] = v.map((r) => r.hex().slice(1));
          }
          const json = JSON.stringify(result, null, '\t');
          // Save file locally
          fs.writeFileSync(outputFile, json);
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
  });
};

module.exports = frames2colors;
