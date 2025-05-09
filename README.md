![SYNTHETIC Audio Logo](public/logo.png)
# A feature-rich web-based DAW
SYNTHETIC Audio is a DAW made from scratch, with no inspiration from other softwares. Almost everything is implemented in a different and unique way.\
[Try it here](https://zxmushroom63.github.io/synthetic-audio/)

## Feature list:
- Timeline
- Use audio samples
- Synths
- Editor layers
- Lots of filters
- Easily draw custom waveforms
- Stereo audio and noise
- Waveform visualiser
- Cool logo
- More LFOs than you know what to do with
- ffmpeg transcoding - export as wav, mp3, m4a, flac, opus & ogg
- Soundfonts (plugins tab & instrument node) - Use up to 127 instruments, more if you find plugins
- HVCC patch support - Load puredata (.pd) patches compiled with [my fork of hvcc](https://github.com/ZXMushroom63/hvcc)
- Multiplayer support!

## Hosting
### Offline
You can load SYNTHETIC from a `file://` URL, and it will function. You won't be able to use ffmpeg codecs (only wav), and no multiplayer support.
### Static website
Host as a static website (eg: github pages). You can use all features, including ffmpeg codecs. Bandwidth usage is heavily optimised through service workers, so you should stay under any quotas very easily.
### Multiplayer server
Clone the repository, run `npm i` and then run `npm run host`. This will activate a server with multiplayer support. To use it, simply go to the website. You should automatically connect to the server. Note that the server will not save the project between restarts, you must manually save to a file and load it.