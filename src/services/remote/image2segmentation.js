const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const getSegmentations = (inputFolder, outputFolder, frames, params) => {
  // Retrieve proto definition
  const protoPath =
      path.join(__dirname, '..', '..', 'proto', 'bytes2bytes.proto');
  const proto = grpc.load(protoPath);
  const Bytes2Bytes = proto.Bytes2Bytes;

  // Create stub
  const rpc = new Bytes2Bytes(
      params.host + ':' + params.services_port.image2segmentation,
      grpc.credentials.createInsecure());

  return new Promise((resolve, reject) => {
    const getNextSegmentation = (i) => {
      process.stdout.write(`➜  Processing frame ${i + 1}/${frames.length}...`);

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

        process.stdout.clearLine();
        process.stdout.cursorTo(0);

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

const image2segmentation = (inputFolder, outputFolder, params) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }
    // retrieve frames list
    const frames = fs.readdirSync(inputFolder);
    // infer caption for each frame
    getSegmentations(inputFolder, outputFolder, frames, params)
        .then(resolve)
        .catch((err) => {
          console.error('ERROR:', err);
        });
  });
};

module.exports = image2segmentation;
