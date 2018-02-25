const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const id = 'audio2spectrogram';
const description = 'Extract mono audio track from video';

let status = 'idle';

function getStatus() {
  return status;
}

const run = (inputFile, output, url, params) => {
  return new Promise((resolve, reject) => {
    // TODO: ⚠️ Spectrogram is computed at 60hz!

    if (path.basename(output).indexOf('.') == '-1') {
      output = path.join(output, 'spectrogram.png');
    }

    // Retrieve proto definition
    const protoPath =
        path.join(__dirname, '..', '..', 'proto', 'bytes2bytes.proto');
    const proto = grpc.load(protoPath);
    const Bytes2Bytes = proto.Bytes2Bytes;

    // Create stub
    const rpc = new Bytes2Bytes(url, grpc.credentials.createInsecure());

    // Load file
    let audio = fs.readFileSync(inputFile);

    status = 'processing on ' + url;
    // Retrieve spectrogram remotely
    /* eslint new-cap: 0 */
    rpc.Run({input: audio}, (err, response) => {
      if (err) {
        rpc.close();
        status = 'error';
        reject(err);
        return;
      }

      // Save file locally
      try {
        const file = fs.createWriteStream(output);
        file.write(response.output);
        file.end();
      } catch (err) {
        reject(err);
      }

      status = 'complete';

      // Resolve
      resolve(output);
    });
  });
};

module.exports = {
  id,
  description,
  run,
  getStatus,
};
