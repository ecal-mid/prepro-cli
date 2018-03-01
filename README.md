## prepro-cli
Maintainer: cyril.diagne [at] ecal.ch

A CLI to run the video preprocessing pipeline of the spring 2018 creative coding course at [ECAL](http://ecal.ch).

![screenshot](https://raw.githubusercontent.com/ecal-mid/prepro-cli/master/medias/prepro-cli.gif)

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
prepro run <video.mov> <output_folder> [options]
```
**Options:**
- `-c` or `--config` : load a specific config file
- `-s` or `--service` : only run a specific service

After the pipeline is complete, the `<output_folder>` will contain the following subfolders:
```
.
├── prepros
|   ├── audio
|   ├── colors
|   ├── flow
|   ├── frames
|   ├── openpose
|   ├── segmentation
|   ├── sift
|   └── spectrogram
├── prepo.json
└── source.mov
```

Available services:
- ✓ `video ➜ frames`
- ✓ `video ➜ audio`
- ✓ `frames ➜ colors`

Services that only work when connected to **ECALNET**:
- ✓ `audio ➜ spectrogram`
- ✓ `frames ➜ human pose`
- ✓ `frames ➜ flow`
- ✓ `frames ➜ segmentation masks`
- ✓ `frames ➜ sift features`
