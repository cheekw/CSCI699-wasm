# OpenCV JS Performance Tests

This test runs OpenCV JS compiled through multiple configurations and outputs runtimes of some commonly used functions.

## Pre-requisites
- cmake
- python
- git
- xcode (mac)

## Specifications
Build last performed on March 29th, 2023</br>
- OpenCV 4.7
- emsdk 2.0.26

## Device Specifications
- Model: MacBook Pro 13-inch, 2018
- OS: macOS Ventura 13.2.1 
- CPU: 2.3 GHz Quad-Core Intel Core i5
- GPU: Intel Iris Plus Graphics 655 1536 MB
- Memory: 16 GB 2133 MHz LPDDR3

## How to run tests

Open HTML and once OpenCV is ready press the run button.

## Steps to reproduce OpenCV builds

Build Tutorial: https://docs.opencv.org/4.x/d4/da1/tutorial_js_setup.html

1) Goto home directory `cd ~`
2) Get emsdk `git clone https://github.com/emscripten-core/emsdk.git`
3) Go into directory `cd emsdk`
4) Install emsdk `./emsdk install 2.0.26`
5) Activate emsdk `./emsdk activate 2.0.26`
6) Set environment variables `source ./emsdk_env.sh`
7) Get OpenCV `git clone https://github.com/opencv/opencv.git`
8) Replace the [two files seen here](https://github.com/opencv/opencv/compare/master...cxcorp:hack-compile-with-latest-emscripten) as described in the following [issue](https://github.com/opencv/opencv/issues/20313)
9) Build asm.js `python ./opencv/platforms/js/build_js.py build_js`
10) Build WASM `python ./opencv/platforms/js/build_js.py build_wasm --build_wasm`
11) Build WASM + Threaded `python ./opencv/platforms/js/build_js.py build_mt --build_wasm --threads`
12) Build WASM + SIMD `python ./opencv/platforms/js/build_js.py build_simd --build_wasm --simd`
13) Build WASM + SIMD + Threaded `python ./opencv/platforms/js/build_js.py build_simd_mt --build_wasm --simd -threads`
    
The neccesary files should be output in emsdk/build_[XX]/bin/oepncv.js
