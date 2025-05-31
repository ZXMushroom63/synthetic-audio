const FscBlockIdentifier = {
    HEADER: 0x64684c46, // FLhd ahh watermark
    FL_VERSION: 0xc7,
    EVENT: 0xdf,
    NOTE: 0xe0,
};

class FscSampleBase {
    constructor(dataView, offset) {
        this.position = dataView.getUint32(offset, true);
    }
}

class FscEventSample extends FscSampleBase {
    static SIZE = 0xc;

    constructor(dataView, offset) {
        super(dataView, offset);

        let currentOffset = offset + 4;
        this.value = dataView.getFloat32(currentOffset + 4, true);
    }
}

class FscNoteSample extends FscSampleBase {
    static SIZE = 0x18;

    constructor(dataView, offset) {
        super(dataView, offset);

        let currentOffset = offset + 4;
        currentOffset += 12;

        this.pitchRaw = dataView.getUint8(currentOffset);
        currentOffset += 2;

        this.releaseRaw = dataView.getUint8(currentOffset);
        currentOffset += 2;

        this.panRaw = dataView.getUint8(currentOffset);
        currentOffset += 1;

        this.velocityRaw = dataView.getUint8(currentOffset);
        currentOffset += 1;

        this.modXRaw = dataView.getUint8(currentOffset);
        currentOffset += 1;

        this.modYRaw = dataView.getUint8(currentOffset);
        currentOffset += 1;

        this.pitch = this.pitchRaw / 0xF0;
        this.release = this.releaseRaw / 0x80;
        this.pan = this.panRaw / 0x80;
        this.velocity = this.velocityRaw / 0x80;
        this.modX = this.modXRaw / 0xFF;
        this.modY = this.modYRaw / 0xFF;
    }
}

class FscHeaderBlock {
    static SIZE = 0x16;

    constructor(dataView, offset) {
        const dataSizeOffset = offset + 0x12;
        this.dataSize = dataView.getUint32(dataSizeOffset, true);

        this.samplesSizeSize = 1;
        if (this.dataSize > 0xa0) {
            this.samplesSizeSize = 2;
        }
        if (this.dataSize > 0x4022) {
            this.samplesSizeSize = 3;
        }
    }
}

class FscFlVersionBlock {
    constructor(dataView, offset) {
        this.size = dataView.getUint8(offset);
        let currentOffset = offset + 1;

        const versionBytes = new Uint8Array(dataView.buffer, dataView.byteOffset + currentOffset, this.size);
        this.version = new TextDecoder().decode(versionBytes);
    }
}

class FscFileParser {
    constructor(arrayBuffer) {
        this.dataView = new DataView(arrayBuffer);
        this.currentOffset = 0;
        this.header = null;
        this.flVersion = null;
        this.samples = [];
        this.blockType = null;
    }

    read() {
        try {
            this.header = new FscHeaderBlock(this.dataView, this.currentOffset);
            this.currentOffset += FscHeaderBlock.SIZE;

            const flVersionIdentifier = this.dataView.getUint8(this.currentOffset);
            this.currentOffset += 1;

            if (flVersionIdentifier !== FscBlockIdentifier.FL_VERSION) {
                return { error: `Expected FL_VERSION identifier (0x${FscBlockIdentifier.FL_VERSION.toString(16)}), got 0x${flVersionIdentifier.toString(16)}` };
            }
            this.flVersion = new FscFlVersionBlock(this.dataView, this.currentOffset);
            this.currentOffset += this.flVersion.size;

            this.currentOffset += 0x0c;

            this.blockType = this.dataView.getUint8(this.currentOffset);
            this.currentOffset += 1;

            if (this.blockType !== FscBlockIdentifier.NOTE && this.blockType !== FscBlockIdentifier.EVENT) {
                return { error: `Unknown main data block identifier: 0x${this.blockType.toString(16)}` };
            }

            this.currentOffset += this.header.samplesSizeSize;

            const sampleSize = (this.blockType === FscBlockIdentifier.NOTE) ? FscNoteSample.SIZE : FscEventSample.SIZE;
            
            const samplesCount = (this.header.dataSize - this.currentOffset) / sampleSize;

            for (let i = 0; i < samplesCount; i++) {
                if (this.currentOffset + sampleSize > this.dataView.byteLength) {
                    console.warn(`Buffer ended early. Expected ${samplesCount} samples, but only read ${i}.`);
                    break;
                }
                if (this.blockType === FscBlockIdentifier.NOTE) {
                    this.samples.push(new FscNoteSample(this.dataView, this.currentOffset));
                } else {
                    this.samples.push(new FscEventSample(this.dataView, this.currentOffset));
                }
                this.currentOffset += sampleSize;
            }

            return {
                header: this.header,
                flVersion: this.flVersion,
                blockType: this.blockType === FscBlockIdentifier.NOTE ? 'NOTE' : 'EVENT',
                samples: this.samples,
            };

        } catch (e) {
            throw new Error("Error parsing FSC file:", e);
        }
    }
}