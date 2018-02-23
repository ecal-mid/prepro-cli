const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const audio2spectrogram = (inputFile, outputFile, params) => {
  return new Promise((resolve, reject) => {
    console.warn('Spectrogram is computed for 60hz!');

    // Retrieve proto definition
    const protoPath =
        path.join(__dirname, '..', '..', 'proto', 'bytes2bytes.proto');
    const proto = grpc.load(protoPath);
    const Bytes2Bytes = proto.Bytes2Bytes;

    // Create stub
    const rpc = new Bytes2Bytes(
        params.host + ':' + params.services_port.audio2spectrogram,
        grpc.credentials.createInsecure());

    // Load file
    let audio = fs.readFileSync(inputFile);

    // Retrieve spectrogram remotely
    /* eslint new-cap: 0 */
    rpc.Run({input: audio}, (err, response) => {
      if (err) {
        rpc.close();
        reject(err);
        return;
      }

      // Save file locally
      const file = fs.createWriteStream(outputFile);
      file.write(response.output);
      file.end();

      // Resolve
      resolve(outputFile);
    });
  });
};

module.exports = audio2spectrogram;
