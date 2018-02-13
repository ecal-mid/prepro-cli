const fs = require('fs');
const path = require('path');
const Storage = require('@google-cloud/storage');

const CONFIG = {
  projectId: 'prepro-dev',
  keyFilename: path.join(__dirname, '..', 'config', 'gcloud-key.json')
};
const BUCKET_NAME = 'prepro-dev';
const bucket = new Storage(CONFIG).bucket(BUCKET_NAME);

const run = (inputFile, outputFolder) => {
  console.log(`Uploading ${inputFile}...`);
  bucket.upload(file)
      .then(() => {
        console.log(`${inputFile} uploaded.`);
      })
      .catch(err => {
        console.error('ERROR:', err);
      });
};

module.exports = run;
