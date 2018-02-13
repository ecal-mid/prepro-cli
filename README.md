## prepro-cli
cyril.diagne [at] ecal.ch

A tool to run the spring 2018 creative coding course preprocessing pipeline.

### 1 - Install dependencies

Install ffmpeg using [homebrew](https://brew.sh/):
```
brew install ffmpeg
npm install -g yarn
```

### 2 - Retrieve & initialize the client

```
git clone git@github.com:ecal-mid/prepro-cli.git
cd prepro-cli
yarn install
yarn link
```

### 3 - Usage

/!\ For now the pipeline only works while connected to ECALNET.

```
prepro run my-video.mov my-output-folder
```
