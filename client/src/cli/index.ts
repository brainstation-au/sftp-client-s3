#!/usr/bin/env node

import yargs from 'yargs';
import * as serverToS3 from './server-to-s3';
import * as s3ToServer from './s3-to-server';

yargs(process.argv.slice(2))
  .scriptName('sftp-client')
  .command(serverToS3)
  .command(s3ToServer)
  .demandCommand()
  .help()
  .argv;
