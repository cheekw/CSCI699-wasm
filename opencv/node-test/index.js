const express = require('express');
const Jimp = require('jimp');
const { cv, cvTranslateError } = require('opencv-wasm');
const fs = require('fs');
const { performance } = require('perf_hooks');

const app = express();
const port = process.env.PORT || '8000';

const run = async () => {
  let jimpSrc = await Jimp.read('../data/blackcat.jpg');
  let src = cv.matFromImageData(jimpSrc.bitmap);
  let dst = new cv.Mat();

  const out = {};
  let power = 5;
  let numTimes = 10;
  for (let i = 0; i < power; i++) {
    let runs = Math.pow(numTimes, i);
    let start = performance.now();
    for (let j = 0; j < runs; j++) {
      cv.transpose(src, dst);
    }
    let end = performance.now();
    let time = end - start;
    out[`${runs}`] = { ms: time };
    console.log(`opencv transpose time: ${time}`);
    console.log(`finished transposing ${runs} times`);
  }

  src.delete();
  dst.delete();

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
