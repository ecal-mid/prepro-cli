#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const pjson = require('./package.json');
const config = require('./src/config');
const {getVideoInfo, logVideoInfo, parseVideoInfo} = require('./src/utils');
const runAll = require('./src/run_all');

program.version(pjson.version)
    .description('Prepro CLI for ECAL Creative Coding course');

program.command('run <video> <output>')
    .alias('r')
    .description('Launches Prepro pipeline on <video>.')
    .option('-s, --service [string]', 'Only run the given service')
    .option('-c, --config [string]', 'Load custom config file', 'config.json')
    .action((video, output, cmd) => {
      try {
        run(video, output, cmd);
      } catch (err) {
        console.error('✖ Prepro ERROR\n'.red);
        console.error(err.stack.red, '\n');
        process.exit(1);
      }
    });

program.parse(process.argv);

function run(video, output, cmd) {
  console.log('');
  for (let l
           of [`prepro CLI v${pjson.version}`.bold,
               `License: ${pjson.license}`]) {
    console.log('➜ '.bold.blue, l);
  }
  console.log('');

  if (!fs.existsSync(video)) {
    throw new Error('File not found ' + path.join(process.cwd(), video).bold);
  }

  console.log('Video:'.blue.bold);
  console.log('-', `${video}`.bold.underline);

  const cfg = config(cmd.config);

  getVideoInfo(video).then((infos) => {
    cfg.video = parseVideoInfo(infos);
    logVideoInfo(cfg.video, infos.format);

    if (!fs.existsSync(output)) {
      mkdirp.sync(output);
      console.log(`Creating output folder ${(process.cwd() + output).bold}\n`);
    }
    if (cmd.service) {
      console.error('not supported yet.');
    } else {
      runAll(video, output, cfg)
          .then((results) => console.log('\nprepro complete!\n'.bold.green))
          .catch((err) => {
            console.error('\n✖ Prepro ERROR\n'.red);
            if (Array.isArray(err)) {
              for (e of err) {
                if (e.stack) {
                  console.error(e.stack.red, '\n');
                } else {
                  console.error(e.red, '\n');
                }
              }
            } else if (err.stack) {
              console.error(err.stack.red, '\n');
            } else {
              console.error(err.red, '\n');
            }
            process.exit(1);
          });
    }
  });
}
