const express = require('express');
const photon = require('@silvia-odwyer/photon-node');
const fs = require('fs');
const { performance } = require('perf_hooks');

const app = express();
const port = process.env.PORT || '8000';

const testFunc = async (funcName, func, json, args) => {
  let base64 = fs.readFileSync(`../../data/blackcat.jpg`, { encoding: 'base64' });
  let data = base64.replace(/^data:image\/(png|jpg);base64,/, '');
  let phtn_img = photon.PhotonImage.new_from_base64(data);

  let power = 5;
  let numTimes = 10;

  json[funcName] = {};
  for (let i = 0; i < power; i++) {
    let runs = Math.pow(numTimes, i);
    let start = performance.now();
    for (let j = 0; j < runs; j++) {
      func(phtn_img, ...args);
    }
    let end = performance.now();
    let time = end - start;
    json[funcName][runs] = { ms: time };
    console.log(`photon ${funcName} time: ${time}ms`);
    console.log(`finished ${funcName} ${runs} times`);
  }
};

const run = async () => {
  const out = {};
  await testFunc('grayscale', photon.grayscale, out, []);
  await testFunc('fliph', photon.fliph, out, []);
  await testFunc('flipv', photon.flipv, out, []);
  fs.writeFile('out.json', JSON.stringify(out), (err) => {
    if (err) {
      console.log(err);
    }
  });
};

app.get('/', (req, res) => {
  run();
  res.status(200).send('Testing');
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
