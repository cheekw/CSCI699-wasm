const express = require('express');
const Jimp = require('jimp');
const { cv } = require('opencv-wasm');
const fs = require('fs');
const { performance } = require('perf_hooks');

const app = express();
const port = process.env.PORT || '8000';

const testFunc = async (funcName, func, json, args) => {
  let jimpSrc = await Jimp.read('../data/blackcat.jpg');
  let src = cv.matFromImageData(jimpSrc.bitmap);
  let dst = new cv.Mat();

  let power = 5;
  let numTimes = 10;

  json[funcName] = {};
  for (let i = 0; i < power; i++) {
    let runs = Math.pow(numTimes, i);
    let start = performance.now();
    for (let j = 0; j < runs; j++) {
      func(src, dst, ...args);
    }
    let end = performance.now();
    let time = end - start;
    json[funcName][runs] = { ms: time };
    console.log(`opencv ${funcName} time: ${time}ms`);
    console.log(`finished ${funcName} ${runs} times`);
  }

  src.delete();
  dst.delete();
};

const run = async () => {
  const out = {};
  await testFunc('transpose', cv.transpose, out, []);
  await testFunc('grayscale', cv.cvtColor, out, [cv.COLOR_RGBA2GRAY, 0]);
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
