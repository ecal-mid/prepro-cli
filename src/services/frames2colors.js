const fs = require('fs');
const path = require('path');
const getColors = require('get-image-colors');

const image2colors = (inputFile) => {
  return getColors(inputFile);
};

const frames2colors = (inputFolder, outputFolder) => {
  return new Promise((resolve, reject) => {
    const frames = fs.readdirSync(inputFolder);
    const promises = [];
    for (let f of frames) {
      const filename = path.join(inputFolder, f);
      promises.push(image2colors(filename));
    }
    Promise.all(promises)
        .then((values) => {
          const result = {};
          for (let i = 0; i < values.length; i++) {
            const f = frames[i];
            const v = values[i];
            result[f] = v.map((r) => r.hex());
          }
          const json = JSON.stringify(result, null, '\t');
          // Save file locally
          fs.writeFileSync(path.join(outputFolder, 'colors.json'), json);
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
  });
};

module.exports = frames2colors;
