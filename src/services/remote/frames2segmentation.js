const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const id = 'frames2segmentation';
const description = 'Extract mono audio track from video';

let status = 'Idle';

function getStatus() {
  return status;
}

const getSegmentations_ = (inputFolder, outputFolder, frames, url, params) => {
  // Retrieve proto definition
  const protoPath =
      path.join(__dirname, '..', '..', 'proto', 'bytes2bytes.proto');
  const proto = grpc.load(protoPath);
  const Bytes2Bytes = proto.Bytes2Bytes;

  // Create stub
  const rpc = new Bytes2Bytes(url, grpc.credentials.createInsecure());

  return new Promise((resolve, reject) => {
    const getNextSegmentation = (i) => {
      status = `processing frame ${i + 1}/${frames.length}`;

      const frameFile = path.join(inputFolder, frames[i]);
      let frame = fs.readFileSync(frameFile);

      /* eslint new-cap: 0 */
      rpc.Run({input: frame}, (err, response) => {
        if (err) {
          reject(err);
          return;
        }

        const outputFilename = path.join(outputFolder, frames[i]);
        const file = fs.createWriteStream(outputFilename);
        file.write(response.output);
        file.end();

        if (i == frames.length - 1) {
          resolve();
        } else {
          getNextSegmentation(++i);
        }
      });
    };
    getNextSegmentation(0);
  });
};

const run = (inputFolder, outputFolder, url, params) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }
    // retrieve frames list
    const frames = fs.readdirSync(inputFolder);
    // infer caption for each frame
    status = 'processing';
    getSegmentations_(inputFolder, outputFolder, frames, url, params)
        .then(() => {
          status = 'complete';
          resolve(outputFolder);
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
