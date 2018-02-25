const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const id = 'video2flow';
const description = 'Extract flow frames from video';

let status = 'idle';

function getStatus() {
  return status;
}

const run = (inputFile, output, url, params) => {
  return new Promise((resolve, reject) => {
    // check if output is folder and give default filename.
    if (path.basename(output).indexOf('.') == '-1') {
      output = path.join(output, 'flow.zip');
    }

    // Retrieve proto definition
    const protoPath =
        path.join(__dirname, '..', '..', 'proto', 'bytes2bytes.proto');
    const proto = grpc.load(protoPath);
    const Bytes2Bytes = proto.Bytes2Bytes;

    // Create stub
    const rpc = new Bytes2Bytes(url, grpc.credentials.createInsecure(), {
      'grpc.max_send_message_length': 100 * 1024 * 1024,
      'grpc.max_receive_message_length': 100 * 1024 * 1024,
    });

    // Load file
    let video = fs.readFileSync(inputFile);

    status = 'processing on ' + url;

    // Retrieve pose remotely
    /* eslint new-cap: 0 */
    rpc.Run({input: video}, (err, response) => {
      if (err) {
        status = 'error';
        rpc.close();
        reject(err);
        return;
      }

      // Save file
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
