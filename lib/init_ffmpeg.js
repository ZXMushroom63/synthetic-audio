if (globalThis.SharedArrayBuffer) {
    globalThis.ffmpeg = FFmpeg.createFFmpeg({
        coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@latest/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@latest/dist/umd/ffmpeg-core.wasm',
        log: false,
    });

    registerEncodingFormat(
        () => [
            "-i", 
            "input.wav",
            "-c:a",
            "libmp3lame",
            "-b:a",
            audio.bitrate + "k",
            "output.mp3"
        ],
        "mp3",
        "(smaller, lossy)",
        "audio/mpeg"
    );

    registerEncodingFormat(
        () => [
            "-i", 
            "input.wav",
            "-c:a",
            "aac",
            "-b:a",
            audio.bitrate + "k",
            "output.m4a"
        ],
        "m4a",
        "(smallest, lossy)",
        "audio/mp4"
    );

    registerEncodingFormat(
        () => [
            "-i", 
            "input.wav",
            "-c:a",
            "flac",
            "-b:a",
            audio.bitrate + "k",
            "output.flac"
        ],
        "flac",
        "(smaller, lossless)",
        "audio/flac"
    );

    registerEncodingFormat(
        () => [
            "-i", 
            "input.wav",
            "-c:a",
            "opus",
            "-b:a",
            audio.bitrate + "k",
            "output.opus"
        ],
        "opus",
        "(smaller, lossy)",
        "audio/ogg; codecs=opus"
    );

    registerEncodingFormat(
        () => [
            "-i", 
            "input.wav",
            "-c:a",
            "libvorbis",
            "-b:a",
            audio.bitrate + "k",
            "output.ogg"
        ],
        "ogg",
        "(smaller, lossy)",
        "audio/ogg"
    );
}