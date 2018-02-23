const fs = require('fs');
const path = require('path');
const getColors = require('get-image-colors');

const id = 'frames2colors';

const description = 'Extract color palette from frames';

let status = 'idle';

function getStatus() {
  return status;
}

const image2colors = (inputFile) => {
  return getColors(inputFile);
};

const run = (inputFolder, output) => {
  return new Promise((resolve, reject) => {
    const promises = [];

    try {
      if (path.basename(output).indexOf('.') == '-1') {
        output = path.join(output, 'colors.json');
      }

      const frames = fs.readdirSync(inputFolder);
      for (let f of frames) {
        const filename = path.join(inputFolder, f);
        promises.push(image2colors(filename));
      }
    } catch (err) {
      status = 'error';
      reject(err);
      return;
    }

    status = 'running';
    Promise.all(promises)
        .then((values) => {
          const result = [];
          for (let i = 0; i < values.length; i++) {
            const v = values[i];
            result[i] = v.map((r) => r.hex().slice(1));
          }
          const json = JSON.stringify(result, null, '\t');
          // Save file
          fs.writeFileSync(output, json);
          status = 'complete';
          resolve(output);
        })
        .catch((err) => {
          console.log('err');
          status = 'error';
          reject(err);
        });
  });
};

module.exports = {
  id,
  description,
  run,
  getStatus,
};
