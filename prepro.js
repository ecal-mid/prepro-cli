#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const mkdirp = require('mkdirp');

const runAll = require('./src/run_all');

program.version('0.0.1').description(
    'Prepro CLI for ECAL Creative Coding course');

program.command('run <video> <output>')
    .alias('r')
    .description('Launches Prepro pipeline on <video>.')
    .option('-s, --service', 'Only run the given service')
    .action((video, output, cmd) => {
      if (!fs.existsSync(output)) {
        mkdirp.sync(output);
        console.log(`Creating output folder ${output}`);
      }
      if (cmd.service) {
        console.log('not supported yet.')
      } else {
        runAll(video, output);
      }
    });

program.parse(process.argv);
