const fs = require('fs');
const path = require('path');
const grpc = require('grpc');
const {compileFrames} = require('../../utils');

const id = 'frames2flow';
const description = 'Extract optical flow from video';

let status = 'idle';

let totalFrames = 0;

const numParallel = 10;

function getStatus() {
  return status;
}

const getFlow_ = (inputFolder, outputFolder, frames, url, params) => {
  // Retrieve proto definition
  const protoPath =
      path.join(__dirname, '..', '..', 'proto', 'frames2bytes.proto');
  const proto = grpc.load(protoPath);
  const Frames2Bytes = proto.Frames2Bytes;

  // Create stub
  const rpc = new Frames2Bytes(url, grpc.credentials.createInsecure());

  return new Promise((resolve, reject) => {
    const getNextFlow = (i) => {
      const pct = (i * numParallel) / totalFrames * 100;
      status = `processing ${pct.toFixed(1)}%`;

      const frameFileA = path.join(inputFolder, frames[i]);
      let frameA = fs.readFileSync(frameFileA);
      const frameFileB = path.join(inputFolder, frames[i + 1]);
      let frameB = fs.readFileSync(frameFileB);

      /* eslint new-cap: 0 */
      rpc.Run({frameA: frameA, frameB: frameB}, (err, response) => {
        if (err) {
          reject(err);
          return;
        }

        const outputFilename = path.join(outputFolder, frames[i]);
        fs.writeFile(outputFilename, response.output, (err) => {
          if (i == frames.length - 2) {
            resolve();
          } else {
            setTimeout(() => {
              getNextFlow(++i);
            }, 1000);
          }
        });
      });
    };
    getNextFlow(0);
  });
};

function cleanup(folder, files) {
  return new Promise((resolve, reject) => {
    try {
      for (let f of files) {
        const p = path.join(folder, f);
        fs.unlinkSync(p);
      }
    } catch (err) {
      reject(err);
    }
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
      const p = getFlow_(inputFolder, outputFolder, slice, url, params);
      promises.push(p);
    }

    // infer caption for each frame
    status = 'processing on ' + url;

    const output = path.join(outputFolder, 'flow.mov');

    Promise.all(promises)
        .then(() => compileFrames(inputFolder, output, params, 0))
        .then(() => {
          const files = fs.readdirSync(outputFolder)
                            .filter((f) => path.extname(f) == '.png');
          return cleanup(outputFolder, files);
        })
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
