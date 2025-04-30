if (globalThis.SharedArrayBuffer) {
    globalThis.ffmpeg = FFmpeg.createFFmpeg({
        coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@latest/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@latest/dist/esm/ffmpeg-core.wasm'
    });
}