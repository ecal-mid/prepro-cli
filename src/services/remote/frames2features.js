const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const id = 'frames2features';
const description = 'Retrieve frames feature vectors';

let status = 'Idle';

let totalFrames = 0;

const numParallel = 2;

function getStatus() {
  return status;
}

const getFeatures_ = (inputFolder, outputFolder, frames, url, params) => {
  // Retrieve proto definition
  const protoPath =
      path.join(__dirname, '..', '..', 'proto', 'bytes2features.proto');
  const proto = grpc.load(protoPath);
  const Bytes2Features = proto.Bytes2Features;

  // Create stub
  const rpc = new Bytes2Features(url, grpc.credentials.createInsecure());

  return new Promise((resolve, reject) => {
    const results = [];
    const getNextFeatures = (i) => {
      const pct = (i * numParallel) / totalFrames * 100;
      status = `processing ${pct.toFixed(2)}%`;

      const frameFile = path.join(inputFolder, frames[i]);
      let frame = fs.readFileSync(frameFile);

      /* eslint new-cap: 0 */
      rpc.Run({input: frame}, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        results.push({
          frame: frames[i],
          data: response.features,
        });
        if (i == frames.length - 1) {
          resolve(results);
        } else {
          getNextFeatures(++i);
        }
      });
    };
    getNextFeatures(0);
  });
};

function compileResults(results, output) {
  return new Promise((resolve, reject) => {
    // Compile results groups
    const resultsArr = [];
    for (const r of results) {
      resultsArr.push(...r);
    }
    const features = resultsArr.sort((a, b) => a.frame < b.frame ? -1 : 1)
                         .map((a) => a.data);
    // Save results
    const outputFile = fs.createWriteStream(output);
    outputFile.write(JSON.stringify(features));
    outputFile.end();
    // Resolve
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

    // run in parallel
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
      const p = getFeatures_(inputFolder, outputFolder, slice, url, params);
      promises.push(p);
    }

    const output = path.join(outputFolder, 'detection.json');

    // run for each frame
    status = 'processing on ' + url;
    Promise.all(promises)
        .then((results) => compileResults(results, output))
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
