const express = require('express');
const Jimp = require('jimp');
const { cv } = require('opencv-wasm');
const fs = require('fs');
const { performance } = require('perf_hooks');
const Vips = require('wasm-vips');
const photon = require('@silvia-odwyer/photon-node');

const app = express();
const port = process.env.PORT || '8000';

const IMAGE_PATH = '../data/blackcat.jpg';
const NUM_TRIALS = 10;
const POWER = 3;
const NUM_TIMES = 10;

const testFunc = async (libname, funcName, func, json, args) => {
  json[libname][funcName] = {};
  for (let i = 0; i < POWER; i++) {
    let runs = Math.pow(NUM_TIMES, i);
    let start = performance.now();
    for (let j = 0; j < runs; j++) {
      func(...args);
    }
    let end = performance.now();
    let time = end - start;
    json[funcName][runs] = { ms: time };
    console.log(`${libname} ${funcName} time: ${time}ms`);
    console.log(`finished ${funcName} ${runs} times`);
  }
};

const testOpenCv = async (libname, out) => {
  let jimpSrc = await Jimp.read(IMAGE_PATH);
  let src = cv.matFromImageData(jimpSrc.bitmap);
  let dst = new cv.Mat();

  out[libName] = {};
  await testFunc(libname, 'transpose', cv.transpose, out, [src, dst]);
  await testFunc(libname, 'grayscale', cv.cvtColor, out, [src, dst, cv.COLOR_RGBA2GRAY, 0]);

  src.delete();
  dst.delete();
};

const testPhoton = async (libname, out) => {
  let base64 = fs.readFileSync(IMAGE_PATH, { encoding: 'base64' });
  let data = base64.replace(/^data:image\/(png|jpg);base64,/, '');
  let phtn_img = photon.PhotonImage.new_from_base64(data);

  out[libName] = {};
  await testFunc(libname, 'grayscale', photon.grayscale, out, [phtn_img]);
  await testFunc(libname, 'fliph', photon.fliph, out, [phtn_img]);
  await testFunc('flipv', photon.flipv, out, [phtn_img]);
};

const testLibvips = async (libname, out) => {
  const vips = await Vips();
  let im = vips.Image.newFromFile(IMAGE_PATH);
  await testFunc(libname, 'grayscale', im.scRGB2BW, out, []);
};

const run = async () => {
  const out = {};
  await testOpenCv('opencv', out);
  await testPhoton('photon', out);
  await testLibvips('libvips', out);
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
