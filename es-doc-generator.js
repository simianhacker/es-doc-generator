#!/usr/bin/env node

const fs = require('fs');
const elasticsearch = require('elasticsearch');

const Combinator = require('./lib/combinator');
const Template = require('./lib/template');

const myArgs = process.argv.slice(2);

const die = (message = "An error occured.") => {
  console.log(`${message}\n`);
  console.log("Usage: node es-doc-generator JOBFILE");
  process.exit(1);
}

const sleep = (millis) => {
  return new Promise(resolve => setTimeout(resolve, millis));
}

if (myArgs.length !== 1) {
  die('Please provide a path to a job file as argument.');
}

let job, config;

try {
  job = JSON.parse(fs.readFileSync(myArgs[0]));
  config = JSON.parse(fs.readFileSync('./config.json'));
} catch(error) {
  die(`An error occured: ${error}`);
}

const C = new Combinator(job.variables);
const T = new Template(job.templates);
const client = new elasticsearch.Client({
  host: config.host,
  httpAuth: `${config.user}:${config.password}`
});

let i = 1;

const send = async (C, T, client, index) => {
  while (true) {
    console.log(`Sending document set ${i}`);
    const variables = C.getCurrent();
    const docs = T.fill(variables);
    docs.forEach(doc => {
      client.index({
        index: T.format(variables, 'INDEX_DATE', index),
        type: '_doc',
        body: doc
      }, function(err, resp, status) {
        if (err) {
          console.log(err, resp, status);
        }
      });
    });
    if (C.hasNext()) {
      i += 1;
      C.next();
      await new Promise(done => setTimeout(done, 500));
    } else {
      break;
    }
  }
}

send(C, T, client, job.index);
