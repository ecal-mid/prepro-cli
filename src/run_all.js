/* eslint-disable no-unused-vars */
const colors = require('colors');
/* eslint-enable no-unused-vars */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const _ALL_ERRORS_FATAL = true;

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
    process.stdout.write(outputName.grey + status + '\n');
  }
}

function saveInfos(services, cfg) {
  for (let s of services) {
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

  console.log('\nSaving summary to', 'prepro.json'.bold);
  const outputFile = path.join(cfg.outputFolder, 'prepro.json');
  const file = fs.createWriteStream(outputFile);
  file.write(JSON.stringify(cfg.video, null, 2));
  file.end();
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

    Promise.all(promises1)
        .then((outputs) => {
          for (let i = 0; i < outputs.length; i++) {
            services1[i].output = outputs[i];
          }
          services2 = services.filter((s) => dependencies.indexOf(s.id) == -1);
          const promises2 =
              services2.map((s) => run(s, inputFile, servicesFolder, cfg));
          return Promise.all(promises2);
        })
        .then((outputs) => {
          for (let i = 0; i < outputs.length; i++) {
            services2[i].output = outputs[i];
          }
          const time = Date.now() - startTime;
          clearInterval(updateLoop);
          logStatus(time, services, true, 1);
          saveInfos(services, cfg);
          resolve(services);
        })
        .catch((err) => {
          if (_ALL_ERRORS_FATAL) {
            reject(err);
          }
          errors.push(err);
        });

    // check updates & global timeout
    logStatus(0, services, false);
    const updateLoop = setInterval(() => {
      const time = Date.now() - startTime;
      logStatus(time, services);

      const pending = services.filter(
          (s) => s.getStatus().indexOf('complete') == -1 &&
              s.getStatus().indexOf('error') == -1);

      if (pending.length == 0) {
        clearInterval(updateLoop);
        reject(errors);
        return;
      }

      if (time > 60 * 60 * 1000) {
        clearInterval(updateLoop);
        reject(errors.length ? errors : new Error('Prepro timed out.'));
      }
    }, 60);
  });
};

module.exports = runAll;
