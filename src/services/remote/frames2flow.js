const fs = require('fs');
const path = require('path');
const grpc = require('grpc');
const {exec} = require('child_process');

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
      const a = i * numParallel;
      const b = (i + 1) * numParallel;
      status = `processing frames ${a}-${b}/${totalFrames}`;

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
        const file = fs.createWriteStream(outputFilename);
        file.write(response.output);
        file.end();

        if (i == frames.length - 2) {
          resolve();
        } else {
          setTimeout(() => {
            getNextFlow(++i);
          }, 1000);
        }
      });
    };
    getNextFlow(0);
  });
};

const compile = (inputFolder, output, cfg) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output);
    }
    const cmd = [
      'ffmpeg',
      '-loglevel warning',
      `-r ${cfg.video.framerate}`,
      `-i ${output}/frame-%03d.png`,
      '-y',
      // codec
      '-c:v libx264',
      `-vf fps=${cfg.video.framerate}`,
      `-x264opts keyint=${cfg.video.framerate}`,
      '-pix_fmt yuv420p',
      '-vb 20M',
      // codec options
      path.join(output, 'flow.mov'),
    ];
    exec(cmd.join(' '), (err, stdout, stderr) => {
      if (err) {
        status = 'error';
        reject(err);
        return;
      }
      resolve(output);
    });
  });
};

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
    status = 'processing';
    // getFlow_(inputFolder, outputFolder, frames, url, params)
    Promise.all(promises)
        .then(() => compile(inputFolder, outputFolder, params))
        .then(() => {
          status = 'complete';
          resolve(path.join(outputFolder, 'flow.mov'));
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
