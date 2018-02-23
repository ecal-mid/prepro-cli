const fs = require('fs');
const path = require('path');
const grpc = require('grpc');

const {spawnDockerService} = require('./utils');

const getCaptions = (inputFolder, frames) => {
  const protoPath = path.join(__dirname, '..', 'proto', 'im2txt.proto');
  const proto = grpc.load(protoPath);
  const Im2Txt = proto.Im2Txt;
  const rpc = new Im2Txt('localhost:50051', grpc.credentials.createInsecure());

  const captions = [];

  return new Promise((resolve, reject) => {
    const getNextCaption = (i) => {
      const frameFile = path.join(inputFolder, frames[i]);
      let frame = fs.readFileSync(frameFile);
      /* eslint new-cap: 0 */
      rpc.Run({image: frame}, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        captions[i] = response.text;
        console.log(i, response.text);
        if (i == frames.length - 1) {
          resolve(captions);
        } else {
          getNextCaption(++i);
        }
      });
    };
    getNextCaption(0);
  });
};

const image2captions = (inputFolder, outputFolder) => {
  return new Promise((resolve, reject) => {
    console.log('Extracting captions');
    let captionsOutputFolder = path.join(outputFolder, 'captions');
    if (!fs.existsSync(captionsOutputFolder)) {
      fs.mkdirSync(captionsOutputFolder);
    }
    // retrieve frames list
    const frames = fs.readdirSync(inputFolder);
    // spawn service with docker
    spawnDockerService('kikko/image2caption').then((service) => {
      // infer caption for each frame
      getCaptions(inputFolder, frames)
          .then((captions) => {
            service.kill();
            // Export to txt files
            const outputFilename =
                path.join(captionsOutputFolder, 'captions.txt');
            const file = fs.createWriteStream(outputFilename);
            file.write(captions.join('\n'));
            file.end();
            console.log('Done');
            resolve();
          })
          .catch((err) => {
            service.kill();
            console.error('ERROR:', err);
          });
    });
  });
};

module.exports = image2captions;
