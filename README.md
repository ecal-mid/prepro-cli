## prepro-cli
cyril.diagne [at] ecal.ch

A CLI to run the video preprocessing pipeline of the spring 2018 creative coding course at [ECAL](http://ecal.ch).

### 1 - Install dependencies

Make sure you have installed :
- [Homebrew](https://brew.sh)
- [Node.js](https://nodejs.org)

Install [FFMPEG](https://www.ffmpeg.org) by running :
```
brew install ffmpeg
```

Install [Yarn](https://yarnpkg.com/en) by running :
```
npm install -g yarn
```

### 2 - Retrieve & initialize the CLI

```
git clone git@github.com:ecal-mid/prepro-cli.git
cd prepro-cli
yarn install
yarn link
```

### 3 - Usage

To run the full pipeline on a video, simply run:
```
prepro run <video.mov> <output_folder>
```

Your `<output_folder>` should now contain the following subfolders:
```
.
+- audio
+- colors
+- frames
+- spectrogram
```


⚠️   Some transformations only while connected to ECALNET.

Currently available transformations:
- ✓ `video ➜ frames`
- ✓ `video ➜ audio`
- ✓ `frames ➜ colors`
- ✓ `audio ➜ spectrogram`
- ✗ frames ➜ human pose
- ✗ frames ➜ flow
- ✗ frames ➜ segmentation masks
