const express = require('express');
const Jimp = require('jimp');
const { cv } = require('opencv-wasm');

const fs = require('fs');
const nodefs = require('fs/promises');
const { performance } = require('perf_hooks');
const photon = require('@silvia-odwyer/photon-node');
const Vips = require('wasm-vips');

const app = express();
const port = process.env.PORT || '8000';

const HAAR_CASCADE_FACE_PATH = './haarcascade_frontalface_default.xml';
const IMAGE_PATH = '../data/lena.jpg';
const NUM_TRIALS = 10;
const NUM_TIMES = 100;

const testFunc = async (libname, funcName, func, json, args) => {
  json[libname][funcName] = {};
  let sum = 0;
  for (let i = 1; i <= NUM_TRIALS; i++) {
    let start = performance.now();
    for (let j = 1; j <= NUM_TIMES; j++) {
      await func(...args);
    }
    let end = performance.now();
    let time = end - start;
    sum += time;
    console.log(`${libname} trial number: ${i}`);
    console.log(`\t${funcName} time: ${time}ms`);
    console.log(`\tfinished ${funcName} ${NUM_TIMES} times\n`);
  }
  const average = sum / NUM_TRIALS;
  json[libname][funcName] = { ms: average };
};

const opencvHaarCascade = (src, gray, faces, faceCascade, msize) => {
  faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
  for (let i = 0; i < faces.size(); ++i) {
    let roiGray = gray.roi(faces.get(i));
    let roiSrc = src.roi(faces.get(i));
    let point1 = new cv.Point(faces.get(i).x, faces.get(i).y);
    let point2 = new cv.Point(
      faces.get(i).x + faces.get(i).width,
      faces.get(i).y + faces.get(i).height
    );
    cv.rectangle(src, point1, point2, [255, 0, 0, 255]);

    roiGray.delete();
    roiSrc.delete();
  }
};

const opencvCanny = (src, dst, dst2) => {
  cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY, 0);
  cv.Canny(dst, dst2, 50, 100, 3, false);
};

const testOpenCv = async (libname, out) => {
  let jimpSrc = await Jimp.read(IMAGE_PATH);
  let src = cv.matFromImageData(jimpSrc.bitmap);
  let dst = new cv.Mat();

  out[libname] = {};

  /*********************/
  /** Transformations */
  let dsize = new cv.Size(src.rows, src.cols);
  let center = new cv.Point(src.cols / 2, src.rows / 2);
  let rotateM = cv.getRotationMatrix2D(center, 90, 1);
  await testFunc(libname, 'rotate 90', cv.warpAffine, out, [
    src,
    dst,
    rotateM,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar(),
  ]);

  let M = cv.Mat.eye(3, 3, cv.CV_32FC1);
  let anchor = new cv.Point(-1, -1);
  await testFunc(libname, '2d convolution', cv.filter2D, out, [
    src,
    dst,
    cv.CV_8U,
    M,
    anchor,
    0,
    cv.BORDER_DEFAULT,
  ]);
  /*********************/

  /*********************/
  /** Filtering */
  await testFunc(libname, 'grayscale', cv.cvtColor, out, [src, dst, cv.COLOR_RGBA2GRAY, 0]);
  await testFunc(libname, 'hsv', cv.cvtColor, out, [src, dst, cv.COLOR_RGB2HSV, 0]);

  /** Smoothening */
  const ksize = new cv.Size(3, 3);
  await testFunc(libname, 'gaussian blur', cv.GaussianBlur, out, [
    src,
    dst,
    ksize,
    0,
    0,
    cv.BORDER_DEFAULT,
  ]);
  await testFunc(libname, 'median blur', cv.medianBlur, out, [src, dst, 5]);
  /*********************/

  /*********************/
  /** Canny's */
  let dst2 = new cv.Mat();
  await testFunc(libname, 'canny', opencvCanny, out, [src, dst, dst2]);
  dst2.delete();
  /*********************/

  /*********************/
  /** Haar Cascade */
  cv.FS_createLazyFile(
    '/',
    'haarcascade_frontalface_default.xml',
    'haarcascade_frontalface_default.xml',
    true,
    false
  );
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  let faces = new cv.RectVector();
  let faceCascade = new cv.CascadeClassifier();
  faceCascade.load(HAAR_CASCADE_FACE_PATH); // load pre-trained classifiers
  let msize = new cv.Size(0, 0);
  await testFunc(libname, 'haar cascade', opencvHaarCascade, out, [
    src,
    gray,
    faces,
    faceCascade,
    msize,
  ]);
  gray.delete();
  faceCascade.delete();
  faces.delete();
  /*********************/

  src.delete();
  dst.delete();
};

const testPhoton = async (libname, out) => {
  let base64 = fs.readFileSync(IMAGE_PATH, { encoding: 'base64' });
  let data = base64.replace(/^data:image\/(png|jpg);base64,/, '');
  let phtn_img = photon.PhotonImage.new_from_base64(data);

  out[libname] = {};

  // transformations
  await testFunc(libname, 'rotate 90', photon.rotate, out, [phtn_img, 90]);

  // filtering
  await testFunc(libname, 'grayscale', photon.grayscale, out, [phtn_img]);
  await testFunc(libname, 'hsv', photon.hsv, out, [phtn_img, 'saturate', 0.5]);

  // smoothening
  await testFunc(libname, 'gaussian blur', photon.gaussian_blur, out, [phtn_img, 5]);
};

const testLibvips = async (libname, out) => {
  out[libname] = {};

  const vips = await Vips();
  let im;

  // Transformations
  im = vips.Image.newFromFile(IMAGE_PATH);
  const rot90 = async (im) => {
    let a = await im.scRGB2BW(im);
  };
  await testFunc(libname, 'rotate 90', rot90, out, [im]);

  // Filtering
  im = vips.Image.newFromFile(IMAGE_PATH);
  const scRGB2BW = async (im) => {
    let a = await im.scRGB2BW(im);
  };
  await testFunc(libname, 'grayscale', scRGB2BW, out, [im]);
  im = vips.Image.newFromFile(IMAGE_PATH);
  const sRGB2HSV = async (im) => {
    let a = await im.sRGB2HSV();
  };
  await testFunc(libname, 'hsv', sRGB2HSV, out, [im]);

  // Smoothening
  im = vips.Image.newFromFile(IMAGE_PATH);
  const gaussblur = async (im) => {
    let a = await im.gaussblur(5);
  };
  await testFunc(libname, 'gaussian blur', gaussblur, out, [im]);

  im = vips.Image.newFromFile(IMAGE_PATH);
  const canny = async (im) => {
    let a = await im.canny(50);
  };
  await testFunc(libname, 'canny', canny, out, [im]);
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
  res.status(200).send('Running Wasm Tests!');
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
