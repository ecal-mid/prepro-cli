const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const id = 'frames2detection';
const description = 'Detect object in video frames';

let status = 'Idle';

let totalFrames = 0;

const numParallel = 2;

function getStatus() {
  return status;
}

const getDetections_ = (inputFolder, outputFolder, frames, url, params) => {
  // Retrieve proto definition
  const protoPath =
      path.join(__dirname, '..', '..', 'proto', 'bytes2boxes.proto');
  const proto = grpc.load(protoPath);
  const Bytes2Boxes = proto.Bytes2Boxes;

  // Create stub
  const rpc = new Bytes2Boxes(url, grpc.credentials.createInsecure());

  return new Promise((resolve, reject) => {
    const results = [];
    const getNextDetection = (i) => {
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
          data: response.detections,
        });
        if (i == frames.length - 1) {
          resolve(results);
        } else {
          getNextDetection(++i);
        }
      });
    };
    getNextDetection(0);
  });
};

function compileResults(results, output) {
  return new Promise((resolve, reject) => {
    // Compile results groups
    const resultsArr = [];
    for (const r of results) {
      resultsArr.push(...r);
    }
    const detections = resultsArr.sort((a, b) => a.frame < b.frame ? -1 : 1)
                           .map((a) => a.data);
    // Save results
    const outputFile = fs.createWriteStream(output);
    outputFile.write(JSON.stringify(detections, null, 2));
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
      const p = getDetections_(inputFolder, outputFolder, slice, url, params);
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
