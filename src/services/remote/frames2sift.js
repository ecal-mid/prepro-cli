const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const id = 'frames2sift';
const description = 'Extract sift features and matches from video';

let status = 'idle';

let totalFrames = 0;

const numParallel = 5;

function getStatus() {
  return status;
}

const getSift_ = (inputFolder, outputFolder, frames, url, params) => {
  // Retrieve proto definition
  const protoPath =
      path.join(__dirname, '..', '..', 'proto', 'frames2sift.proto');
  const proto = grpc.load(protoPath);
  const Frames2Sift = proto.Frames2Sift;

  // Create stub
  const rpc = new Frames2Sift(url, grpc.credentials.createInsecure());

  return new Promise((resolve, reject) => {
    const getNextSift = (i) => {
      const pct = (i * numParallel) / totalFrames * 100;
      status = `processing ${pct.toFixed(1)}%`;

      const frameFileA = path.join(inputFolder, frames[i]);
      let frameA = fs.readFileSync(frameFileA);
      const frameFileB = path.join(inputFolder, frames[i + 1]);
      let frameB = fs.readFileSync(frameFileB);

      /* eslint new-cap: 0 */
      const handler = (err, response) => {
        if (err) {
          reject(err);
          return;
        }

        const outputFilename =
            path.join(outputFolder, frames[i].split('.').shift() + '.json');
        const file = fs.createWriteStream(outputFilename);
        file.write(JSON.stringify(response));
        file.end();

        if (i == frames.length - 2) {
          resolve();
        } else {
          setTimeout(() => {
            getNextSift(++i);
          }, 1000);
        }
      };
      try {
        rpc.Run({frameA: frameA, frameB: frameB}, handler);
      } catch (e) {
        reject(e);
        return;
      }
    };
    getNextSift(0);
  });
};

function compile(folder, outputFile) {
  return new Promise((resolve, reject) => {
    const files =
        fs.readdirSync(folder).filter((f) => path.extname(f) == '.json');
    const results = [];
    for (let jsonFile of files) {
      const filename = path.join(folder, jsonFile);
      let json = JSON.parse(fs.readFileSync(filename));
      results.push(json);
    }

    const output = fs.createWriteStream(outputFile);
    output.write(JSON.stringify(results, null, 2));
    output.end();

    resolve();
  });
}

const run = (inputFolder, outputFolder, url, params) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }
    // retrieve frames list
    const frames = fs.readdirSync(inputFolder);
    totalFrames = frames.length;
    const length = frames.length / numParallel;
    const promises = [];
    while (frames.length) {
      const slice = frames.splice(0, length);
      if (frames.length) {
        slice.push(frames[0]);
      }
      if (frames.length == 1) {
        frames.push(frames[0]);
      }
      const p = getSift_(inputFolder, outputFolder, slice, url, params);
      promises.push(p);
    }

    status = 'processing on ' + url;

    const output = path.join(outputFolder, 'sift.json');

    Promise.all(promises)
        .then(() => compile(outputFolder, output))
        .then(() => {
          status = 'complete';
          resolve(output);
        })
        .catch(reject);
  });
};

module.exports = {
  id,
  description,
  run,
  getStatus,
};
