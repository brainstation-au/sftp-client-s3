#!/usr/bin/env node

import * as fs from 'fs';
import yargs from 'yargs';
import * as serverToS3 from './server-to-s3';
import * as s3ToServer from './s3-to-server';

yargs(process.argv.slice(2))
  .scriptName('sftp-client')
  .command(serverToS3)
  .command(s3ToServer)
  .demandCommand()
  .alias('v', 'version')
  .version(JSON.parse(fs.readFileSync('package.json', 'utf-8')).version)
  .describe('v', 'show version information')
  .help('help')
  .usage('Usage: $0 -x [num]')
  .showHelpOnFail(false, 'Specify --help for available options')
  .argv;
