const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const video2openpose = (inputFile, outputFile, params) => {
  return new Promise((resolve, reject) => {
    // Retrieve proto definition
    const protoPath =
        path.join(__dirname, '..', '..', 'proto', 'bytes2text.proto');
    const proto = grpc.load(protoPath);
    const Bytes2Text = proto.Bytes2Text;

    // Create stub
    const url = params.host + ':' + params.services_port.video2openpose;
    const rpc = new Bytes2Text(url, grpc.credentials.createInsecure());

    // Load file
    let video = fs.readFileSync(inputFile);

    // Retrieve pose remotely
    rpc.Run({input: video}, (err, response) => {
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

module.exports = video2openpose;
