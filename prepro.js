#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const mkdirp = require('mkdirp');

const pjson = require('./package.json');
const runAll = require('./src/run_all');

program.version(pjson.version)
    .description('Prepro CLI for ECAL Creative Coding course');

program.command('run <video> <output>')
    .alias('r')
    .description('Launches Prepro pipeline on <video>.')
    .option('-s, --service [string]', 'Only run the given service')
    .option('-c, --config [string]', 'Load custom config file', 'config.json')
    .action((video, output, cmd) => {
      console.log(
          '-'.bold.blue,
          `\nprepro CLI`.bold,
          `\nv${pjson.version}`,
          '\n-'.bold.blue,
      );
      if (!fs.existsSync(output)) {
        mkdirp.sync(output);
        console.log(`Creating output folder ${output}`);
      }
      if (cmd.service) {
        console.log('not supported yet.')
      } else {
        runAll(video, output, cmd);
      }
    });

program.parse(process.argv);
