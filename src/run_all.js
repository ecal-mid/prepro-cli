/* eslint-disable no-unused-vars */
const colors = require('colors');
/* eslint-enable no-unused-vars */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const sharp = require('sharp');

const _ALL_ERRORS_FATAL = false;

function ensurePath(path) {
  if (!fs.existsSync(path)) {
    mkdirp.sync(path);
  }
  return path;
}

function logStatus(time, services, clear = true) {
  if (clear) {
    const offset = services.length + 1;
    process.stdout.write(`\x1b[${offset}A`);
  }
  process.stdout.write(
      'Running... '.bold.blue + ((time / 1000).toFixed(2) + 's\n').grey);
  for (let s of services) {
    let status = s.getStatus();
    if (status == 'complete') {
      status = ('✓ ' + status).bold.green;
    } else if (status.indexOf('processing') != -1) {
      const anim = ['⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽', '⣾'];
      const frame = anim[Math.floor((Date.now()) / 100 % anim.length)];
      status = (frame + ' ' + status).bold.yellow;
    } else if (status == 'error') {
      status = ('✕ ' + status).red;
    }
    let outputName = s.id.split('2').pop();
    outputName = '  ' + outputName.padEnd(14);
    process.stdout.clearLine();
    process.stdout.write(outputName + status + '\n');
  }
}

function saveInfos(services, cfg) {
  return new Promise((resolve, reject) => {
    // Save prepro.json
    try {
      for (let s of services) {
        if (!s.output) {
          continue;
        }
        // determine type of output
        let type;
        if (s.output.indexOf('.') == -1) {
          ensurePath(s.output);
          type = 'frames';
        } else {
          const folder = s.output.split('/');
          folder.pop();
          ensurePath(path.join.apply(null, folder));
          type = s.output.split('.').pop();
        }
        // save infos
        cfg.video.services.push({
          'name': s.id,
          'path': path.relative(cfg.outputFolder, s.output),
          'type': type,
        });
      }
      const outputFile = path.join(cfg.outputFolder, 'prepro.json');
      const file = fs.createWriteStream(outputFile);
      file.write(JSON.stringify(cfg.video, null, 2));
      file.end();

      // save thumbnail
      const frame1 =
          path.join(cfg.outputFolder, 'prepros', 'frames', 'frame-0001.png');
      const thumbnail = path.join(cfg.outputFolder, 'prepros', 'thumbnail.jpg');
      getThumbnail(frame1, thumbnail, 300)
          .then(() => resolve())
          .catch((err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

function getThumbnail(inputFile, outputFile, size) {
  const bmp = fs.readFileSync(inputFile);
  return sharp(bmp).resize(size).toFile(outputFile);
}

function run(service, input, outputFolder, cfg) {
  if (service.id == 'video2kfvideo') {
    outputFolder = path.join(outputFolder, '..');
  } else {
    outputFolder = path.join(outputFolder, service.id.split('2').pop());
  }

  if (service.id.startsWith('frames2') ||
      service.id.startsWith('remote/frames2')) {
    input = path.join(outputFolder, '..', 'frames');
  }

  if (service.id.startsWith('audio2') ||
      service.id.startsWith('remote/audio2')) {
    input = path.join(outputFolder, '..', 'audio', 'mono.wav');
  }

  ensurePath(outputFolder);
  let remoteUrl = service.def.url;
  if (remoteUrl) {
    return service.run(input, outputFolder, remoteUrl, cfg);
  } else {
    return service.run(input, outputFolder, cfg);
  }
}

function runAll(inputFile, outputFolder, cfg) {
  cfg.outputFolder = outputFolder;

  servicesFolder = ensurePath(path.join(outputFolder, 'prepros'));

  return new Promise((resolve, reject) => {
    let services = [];

    for (let serviceDef of cfg.services) {
      const service = require('./' + path.join('services', serviceDef.id));
      // TODO: we shouldnt create the serviceDef property
      service.def = serviceDef;
      services.push(service);
    }

    let startTime = Date.now();

    const dependencies = ['video2frames', 'video2audio'];
    const services1 = services.filter((s) => dependencies.indexOf(s.id) != -1);
    const promises1 =
        services1.map((s) => run(s, inputFile, servicesFolder, cfg));

    const errors = [];

    let services2;
    let promises2;
    Promise.all(promises1)
        .then((outputs) => {
          for (let i = 0; i < outputs.length; i++) {
            services1[i].output = outputs[i];
          }
          services2 = services.filter((s) => dependencies.indexOf(s.id) == -1);
          promises2 =
              services2.map((s) => run(s, inputFile, servicesFolder, cfg));
          return settle(promises2);
        })
        .then((outputs) => {
          // compile results
          for (let i = 0; i < outputs.length; i++) {
            if (outputs[i].state === 'rejected') {
              errors.push(outputs[i].value);
            } else {
              services2[i].output = outputs[i].value;
            }
          }
          const time = Date.now() - startTime;
          clearInterval(updateLoop);
          if (cfg.onUpdate) {
            cfg.onUpdate(time, services);
          } else {
            logStatus(time, services, true, 1);
          }

          return saveInfos(services, cfg);
        })
        .then(() => {
          if (errors.length) {
            reject({services: services, services_error: errors});
          } else {
            resolve(services);
          }
        })
        .catch((err) => {
          if (_ALL_ERRORS_FATAL) {
            reject(err);
          }
          errors.push(err);
        });

    // check updates & global timeout
    if (cfg.onUpdate) {
      cfg.onUpdate(0, services);
    } else {
      logStatus(0, services, false);
    }

    const updateLoop = setInterval(() => {
      const time = Date.now() - startTime;

      if (cfg.onUpdate) {
        cfg.onUpdate(time, services);
      } else {
        logStatus(time, services);
      }

      // If all services are either complete or error and the updateLoop
      // is still running, it means the pipeline is complete with errors.
      const pending = services.filter(
          (s) => s.getStatus().indexOf('complete') == -1 &&
              s.getStatus().indexOf('error') == -1);
      if (pending.length == 0) {
        clearInterval(updateLoop);
        saveInfos(services, cfg).then(() => {
          reject({services_error: errors});
        });
        return;
      }

      if (time > 60 * 60 * 1000) {
        clearInterval(updateLoop);
        reject(errors.length ? errors : new Error('Prepro timed out.'));
      }
    }, cfg.updateInterval || 60);
  });
};

function settle(arr) {
  return Promise.all(arr.map((promise) => {
    return promise.then(
        (value) => ({state: 'fullfilled', value}),
        (value) => ({state: 'rejected', value}));
  }));
}

module.exports = runAll;
