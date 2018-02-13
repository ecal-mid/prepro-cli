const path = require('path');
const {spawn} = require('child_process');

const getDockerCmd = (inputFile, outputFolder, entryFolder) => {
  const inputFolder = path.dirname(inputFile);
  const absInputFolder = path.join(process.cwd(), inputFolder);
  const absOutputFolder = path.join(process.cwd(), outputFolder);
  return [
    'docker',
    'run',
    `-v=${absInputFolder}:${entryFolder}/${inputFolder}`,
    `-v=${absOutputFolder}:${entryFolder}/${outputFolder}`,
  ];
};

const spawnDockerService = (service) => {
  return new Promise((resolve, reject) => {
    console.log(`Launching service ${service}`);
    const dock = spawn('docker', ['run', '--rm', '-p', '50051:50051', service])
    // dock.stdout.on('data', (data) => {
    //   console.log(data.toString());
    // });
    let done = false;
    dock.stderr.on('data', (data) => {
      console.log(data.toString());
      if (data.toString().indexOf('collection name is deprecated') > -1) {
        if (!done) {
          done = true;
          setTimeout(() => {
            console.log(`${service} is running`);
            resolve(dock);
          }, 5000);
        }
      }
    });

    dock.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

    dock.on('error', (error) => {
      console.log('error');
      reject(error);
    });
  });
};

module.exports = {
  getDockerCmd,
  spawnDockerService
};
