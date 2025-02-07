// # midi-file
// By Carter Thaxton under the MIT license
// i just browserify'd it
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    globalThis.MIDI_LIB = require('midi-file');
    
    },{"midi-file":2}],2:[function(require,module,exports){
    exports.parseMidi = require('./lib/midi-parser')
    exports.writeMidi = require('./lib/midi-writer')
    
    },{"./lib/midi-parser":3,"./lib/midi-writer":4}],3:[function(require,module,exports){
    // data can be any array-like object.  It just needs to support .length, .slice, and an element getter []
    
    function parseMidi(data) {
      var p = new Parser(data)
    
      var headerChunk = p.readChunk()
      if (headerChunk.id != 'MThd')
        throw "Bad MIDI file.  Expected 'MThd', got: '" + headerChunk.id + "'"
      var header = parseHeader(headerChunk.data)
    
      var tracks = []
      for (var i=0; !p.eof() && i < header.numTracks; i++) {
        var trackChunk = p.readChunk()
        if (trackChunk.id != 'MTrk')
          throw "Bad MIDI file.  Expected 'MTrk', got: '" + trackChunk.id + "'"
        var track = parseTrack(trackChunk.data)
        tracks.push(track)
      }
    
      return {
        header: header,
        tracks: tracks
      }
    }
    
    
    function parseHeader(data) {
      var p = new Parser(data)
    
      var format = p.readUInt16()
      var numTracks = p.readUInt16()
    
      var result = {
        format: format,
        numTracks: numTracks
      }
    
      var timeDivision = p.readUInt16()
      if (timeDivision & 0x8000) {
        result.framesPerSecond = 0x100 - (timeDivision >> 8)
        result.ticksPerFrame = timeDivision & 0xFF
      } else {
        result.ticksPerBeat = timeDivision
      }
    
      return result
    }
    
    function parseTrack(data) {
      var p = new Parser(data)
    
      var events = []
      while (!p.eof()) {
        var event = readEvent()
        events.push(event)
      }
    
      return events
    
      var lastEventTypeByte = null
    
      function readEvent() {
        var event = {}
        event.deltaTime = p.readVarInt()
    
        var eventTypeByte = p.readUInt8()
    
        if ((eventTypeByte & 0xf0) === 0xf0) {
          // system / meta event
          if (eventTypeByte === 0xff) {
            // meta event
            event.meta = true
            var metatypeByte = p.readUInt8()
            var length = p.readVarInt()
            switch (metatypeByte) {
              case 0x00:
                event.type = 'sequenceNumber'
                if (length !== 2) throw "Expected length for sequenceNumber event is 2, got " + length
                event.number = p.readUInt16()
                return event
              case 0x01:
                event.type = 'text'
                event.text = p.readString(length)
                return event
              case 0x02:
                event.type = 'copyrightNotice'
                event.text = p.readString(length)
                return event
              case 0x03:
                event.type = 'trackName'
                event.text = p.readString(length)
                return event
              case 0x04:
                event.type = 'instrumentName'
                event.text = p.readString(length)
                return event
              case 0x05:
                event.type = 'lyrics'
                event.text = p.readString(length)
                return event
              case 0x06:
                event.type = 'marker'
                event.text = p.readString(length)
                return event
              case 0x07:
                event.type = 'cuePoint'
                event.text = p.readString(length)
                return event
              case 0x20:
                event.type = 'channelPrefix'
                if (length != 1) throw "Expected length for channelPrefix event is 1, got " + length
                event.channel = p.readUInt8()
                return event
              case 0x21:
                event.type = 'portPrefix'
                if (length != 1) throw "Expected length for portPrefix event is 1, got " + length
                event.port = p.readUInt8()
                return event
              case 0x2f:
                event.type = 'endOfTrack'
                if (length != 0) throw "Expected length for endOfTrack event is 0, got " + length
                return event
              case 0x51:
                event.type = 'setTempo';
                if (length != 3) throw "Expected length for setTempo event is 3, got " + length
                event.microsecondsPerBeat = p.readUInt24()
                return event
              case 0x54:
                event.type = 'smpteOffset';
                if (length != 5) throw "Expected length for smpteOffset event is 5, got " + length
                var hourByte = p.readUInt8()
                var FRAME_RATES = { 0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30 }
                event.frameRate = FRAME_RATES[hourByte & 0x60]
                event.hour = hourByte & 0x1f
                event.min = p.readUInt8()
                event.sec = p.readUInt8()
                event.frame = p.readUInt8()
                event.subFrame = p.readUInt8()
                return event
              case 0x58:
                event.type = 'timeSignature'
                if (length != 2 && length != 4) throw "Expected length for timeSignature event is 4 or 2, got " + length
                event.numerator = p.readUInt8()
                event.denominator = (1 << p.readUInt8())
                if (length === 4) {
                  event.metronome = p.readUInt8()
                  event.thirtyseconds = p.readUInt8()
                } else {
                  event.metronome = 0x24
                  event.thirtyseconds = 0x08
                }
                return event
              case 0x59:
                event.type = 'keySignature'
                if (length != 2) throw "Expected length for keySignature event is 2, got " + length
                event.key = p.readInt8()
                event.scale = p.readUInt8()
                return event
              case 0x7f:
                event.type = 'sequencerSpecific'
                event.data = p.readBytes(length)
                return event
              default:
                event.type = 'unknownMeta'
                event.data = p.readBytes(length)
                event.metatypeByte = metatypeByte
                return event
            }
          } else if (eventTypeByte == 0xf0) {
            event.type = 'sysEx'
            var length = p.readVarInt()
            event.data = p.readBytes(length)
            return event
          } else if (eventTypeByte == 0xf7) {
            event.type = 'endSysEx'
            var length = p.readVarInt()
            event.data = p.readBytes(length)
            return event
          } else {
            throw "Unrecognised MIDI event type byte: " + eventTypeByte
          }
        } else {
          // channel event
          var param1
          if ((eventTypeByte & 0x80) === 0) {
            // running status - reuse lastEventTypeByte as the event type.
            // eventTypeByte is actually the first parameter
            if (lastEventTypeByte === null)
              throw "Running status byte encountered before status byte"
            param1 = eventTypeByte
            eventTypeByte = lastEventTypeByte
            event.running = true
          } else {
            param1 = p.readUInt8()
            lastEventTypeByte = eventTypeByte
          }
          var eventType = eventTypeByte >> 4
          event.channel = eventTypeByte & 0x0f
          switch (eventType) {
            case 0x08:
              event.type = 'noteOff'
              event.noteNumber = param1
              event.velocity = p.readUInt8()
              return event
            case 0x09:
              var velocity = p.readUInt8()
              event.type = velocity === 0 ? 'noteOff' : 'noteOn'
              event.noteNumber = param1
              event.velocity = velocity
              if (velocity === 0) event.byte9 = true
              return event
            case 0x0a:
              event.type = 'noteAftertouch'
              event.noteNumber = param1
              event.amount = p.readUInt8()
              return event
            case 0x0b:
              event.type = 'controller'
              event.controllerType = param1
              event.value = p.readUInt8()
              return event
            case 0x0c:
              event.type = 'programChange'
              event.programNumber = param1
              return event
            case 0x0d:
              event.type = 'channelAftertouch'
              event.amount = param1
              return event
            case 0x0e:
              event.type = 'pitchBend'
              event.value = (param1 + (p.readUInt8() << 7)) - 0x2000
              return event
            default:
              throw "Unrecognised MIDI event type: " + eventType
          }
        }
      }
    }
    
    function Parser(data) {
      this.buffer = data
      this.bufferLen = this.buffer.length
      this.pos = 0
    }
    
    Parser.prototype.eof = function() {
      return this.pos >= this.bufferLen
    }
    
    Parser.prototype.readUInt8 = function() {
      var result = this.buffer[this.pos]
      this.pos += 1
      return result
    }
    
    Parser.prototype.readInt8 = function() {
      var u = this.readUInt8()
      if (u & 0x80)
        return u - 0x100
      else
        return u
    }
    
    Parser.prototype.readUInt16 = function() {
      var b0 = this.readUInt8(),
          b1 = this.readUInt8()
    
        return (b0 << 8) + b1
    }
    
    Parser.prototype.readInt16 = function() {
      var u = this.readUInt16()
      if (u & 0x8000)
        return u - 0x10000
      else
        return u
    }
    
    Parser.prototype.readUInt24 = function() {
      var b0 = this.readUInt8(),
          b1 = this.readUInt8(),
          b2 = this.readUInt8()
    
        return (b0 << 16) + (b1 << 8) + b2
    }
    
    Parser.prototype.readInt24 = function() {
      var u = this.readUInt24()
      if (u & 0x800000)
        return u - 0x1000000
      else
        return u
    }
    
    Parser.prototype.readUInt32 = function() {
      var b0 = this.readUInt8(),
          b1 = this.readUInt8(),
          b2 = this.readUInt8(),
          b3 = this.readUInt8()
    
        return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3
    }
    
    Parser.prototype.readBytes = function(len) {
      var bytes = this.buffer.slice(this.pos, this.pos + len)
      this.pos += len
      return bytes
    }
    
    Parser.prototype.readString = function(len) {
      var bytes = this.readBytes(len)
      return String.fromCharCode.apply(null, bytes)
    }
    
    Parser.prototype.readVarInt = function() {
      var result = 0
      while (!this.eof()) {
        var b = this.readUInt8()
        if (b & 0x80) {
          result += (b & 0x7f)
          result <<= 7
        } else {
          // b is last byte
          return result + b
        }
      }
      // premature eof
      return result
    }
    
    Parser.prototype.readChunk = function() {
      var id = this.readString(4)
      var length = this.readUInt32()
      var data = this.readBytes(length)
      return {
        id: id,
        length: length,
        data: data
      }
    }
    
    module.exports = parseMidi
    
    },{}],4:[function(require,module,exports){
    // data should be the same type of format returned by parseMidi
    // for maximum compatibililty, returns an array of byte values, suitable for conversion to Buffer, Uint8Array, etc.
    
    // opts:
    // - running              reuse previous eventTypeByte when possible, to compress file
    // - useByte9ForNoteOff   use 0x09 for noteOff when velocity is zero
    
    function writeMidi(data, opts) {
      if (typeof data !== 'object')
        throw 'Invalid MIDI data'
    
      opts = opts || {}
    
      var header = data.header || {}
      var tracks = data.tracks || []
      var i, len = tracks.length
    
      var w = new Writer()
      writeHeader(w, header, len)
    
      for (i=0; i < len; i++) {
        writeTrack(w, tracks[i], opts)
      }
    
      return w.buffer
    }
    
    function writeHeader(w, header, numTracks) {
      var format = header.format == null ? 1 : header.format
    
      var timeDivision = 128
      if (header.timeDivision) {
        timeDivision = header.timeDivision
      } else if (header.ticksPerFrame && header.framesPerSecond) {
        timeDivision = (-(header.framesPerSecond & 0xFF) << 8) | (header.ticksPerFrame & 0xFF)
      } else if (header.ticksPerBeat) {
        timeDivision = header.ticksPerBeat & 0x7FFF
      }
    
      var h = new Writer()
      h.writeUInt16(format)
      h.writeUInt16(numTracks)
      h.writeUInt16(timeDivision)
    
      w.writeChunk('MThd', h.buffer)
    }
    
    function writeTrack(w, track, opts) {
      var t = new Writer()
      var i, len = track.length
      var eventTypeByte = null
      for (i=0; i < len; i++) {
        // Reuse last eventTypeByte when opts.running is set, or event.running is explicitly set on it.
        // parseMidi will set event.running for each event, so that we can get an exact copy by default.
        // Explicitly set opts.running to false, to override event.running and never reuse last eventTypeByte.
        if (opts.running === false || !opts.running && !track[i].running) eventTypeByte = null
    
        eventTypeByte = writeEvent(t, track[i], eventTypeByte, opts.useByte9ForNoteOff)
      }
      w.writeChunk('MTrk', t.buffer)
    }
    
    function writeEvent(w, event, lastEventTypeByte, useByte9ForNoteOff) {
      var type = event.type
      var deltaTime = event.deltaTime
      var text = event.text || ''
      var data = event.data || []
      var eventTypeByte = null
      w.writeVarInt(deltaTime)
    
      switch (type) {
        // meta events
        case 'sequenceNumber':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x00)
          w.writeVarInt(2)
          w.writeUInt16(event.number)
          break;
    
        case 'text':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x01)
          w.writeVarInt(text.length)
          w.writeString(text)
          break;
    
        case 'copyrightNotice':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x02)
          w.writeVarInt(text.length)
          w.writeString(text)
          break;
    
        case 'trackName':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x03)
          w.writeVarInt(text.length)
          w.writeString(text)
          break;
    
        case 'instrumentName':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x04)
          w.writeVarInt(text.length)
          w.writeString(text)
          break;
    
        case 'lyrics':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x05)
          w.writeVarInt(text.length)
          w.writeString(text)
          break;
    
        case 'marker':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x06)
          w.writeVarInt(text.length)
          w.writeString(text)
          break;
    
        case 'cuePoint':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x07)
          w.writeVarInt(text.length)
          w.writeString(text)
          break;
    
        case 'channelPrefix':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x20)
          w.writeVarInt(1)
          w.writeUInt8(event.channel)
          break;
    
        case 'portPrefix':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x21)
          w.writeVarInt(1)
          w.writeUInt8(event.port)
          break;
    
        case 'endOfTrack':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x2F)
          w.writeVarInt(0)
          break;
    
        case 'setTempo':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x51)
          w.writeVarInt(3)
          w.writeUInt24(event.microsecondsPerBeat)
          break;
    
        case 'smpteOffset':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x54)
          w.writeVarInt(5)
          var FRAME_RATES = { 24: 0x00, 25: 0x20, 29: 0x40, 30: 0x60 }
          var hourByte = (event.hour & 0x1F) | FRAME_RATES[event.frameRate]
          w.writeUInt8(hourByte)
          w.writeUInt8(event.min)
          w.writeUInt8(event.sec)
          w.writeUInt8(event.frame)
          w.writeUInt8(event.subFrame)
          break;
    
        case 'timeSignature':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x58)
          w.writeVarInt(4)
          w.writeUInt8(event.numerator)
          var denominator = Math.floor((Math.log(event.denominator) / Math.LN2)) & 0xFF
          w.writeUInt8(denominator)
          w.writeUInt8(event.metronome)
          w.writeUInt8(event.thirtyseconds || 8)
          break;
    
        case 'keySignature':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x59)
          w.writeVarInt(2)
          w.writeInt8(event.key)
          w.writeUInt8(event.scale)
          break;
    
        case 'sequencerSpecific':
          w.writeUInt8(0xFF)
          w.writeUInt8(0x7F)
          w.writeVarInt(data.length)
          w.writeBytes(data)
          break;
    
        case 'unknownMeta':
          if (event.metatypeByte != null) {
            w.writeUInt8(0xFF)
            w.writeUInt8(event.metatypeByte)
            w.writeVarInt(data.length)
            w.writeBytes(data)
          }
          break;
    
        // system-exclusive
        case 'sysEx':
          w.writeUInt8(0xF0)
          w.writeVarInt(data.length)
          w.writeBytes(data)
          break;
    
        case 'endSysEx':
          w.writeUInt8(0xF7)
          w.writeVarInt(data.length)
          w.writeBytes(data)
          break;
    
        // channel events
        case 'noteOff':
          // Use 0x90 when opts.useByte9ForNoteOff is set and velocity is zero, or when event.byte9 is explicitly set on it.
          // parseMidi will set event.byte9 for each event, so that we can get an exact copy by default.
          // Explicitly set opts.useByte9ForNoteOff to false, to override event.byte9 and always use 0x80 for noteOff events.
          var noteByte = ((useByte9ForNoteOff !== false && event.byte9) || (useByte9ForNoteOff && event.velocity == 0)) ? 0x90 : 0x80
    
          eventTypeByte = noteByte | event.channel
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte)
          w.writeUInt8(event.noteNumber)
          w.writeUInt8(event.velocity)
          break;
    
        case 'noteOn':
          eventTypeByte = 0x90 | event.channel
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte)
          w.writeUInt8(event.noteNumber)
          w.writeUInt8(event.velocity)
          break;
    
        case 'noteAftertouch':
          eventTypeByte = 0xA0 | event.channel
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte)
          w.writeUInt8(event.noteNumber)
          w.writeUInt8(event.amount)
          break;
    
        case 'controller':
          eventTypeByte = 0xB0 | event.channel
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte)
          w.writeUInt8(event.controllerType)
          w.writeUInt8(event.value)
          break;
    
        case 'programChange':
          eventTypeByte = 0xC0 | event.channel
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte)
          w.writeUInt8(event.programNumber)
          break;
    
        case 'channelAftertouch':
          eventTypeByte = 0xD0 | event.channel
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte)
          w.writeUInt8(event.amount)
          break;
    
        case 'pitchBend':
          eventTypeByte = 0xE0 | event.channel
          if (eventTypeByte !== lastEventTypeByte) w.writeUInt8(eventTypeByte)
          var value14 = 0x2000 + event.value
          var lsb14 = (value14 & 0x7F)
          var msb14 = (value14 >> 7) & 0x7F
          w.writeUInt8(lsb14)
          w.writeUInt8(msb14)
        break;
    
        default:
          throw 'Unrecognized event type: ' + type
      }
      return eventTypeByte
    }
    
    
    function Writer() {
      this.buffer = []
    }
    
    Writer.prototype.writeUInt8 = function(v) {
      this.buffer.push(v & 0xFF)
    }
    Writer.prototype.writeInt8 = Writer.prototype.writeUInt8
    
    Writer.prototype.writeUInt16 = function(v) {
      var b0 = (v >> 8) & 0xFF,
          b1 = v & 0xFF
    
      this.writeUInt8(b0)
      this.writeUInt8(b1)
    }
    Writer.prototype.writeInt16 = Writer.prototype.writeUInt16
    
    Writer.prototype.writeUInt24 = function(v) {
      var b0 = (v >> 16) & 0xFF,
          b1 = (v >> 8) & 0xFF,
          b2 = v & 0xFF
    
      this.writeUInt8(b0)
      this.writeUInt8(b1)
      this.writeUInt8(b2)
    }
    Writer.prototype.writeInt24 = Writer.prototype.writeUInt24
    
    Writer.prototype.writeUInt32 = function(v) {
      var b0 = (v >> 24) & 0xFF,
          b1 = (v >> 16) & 0xFF,
          b2 = (v >> 8) & 0xFF,
          b3 = v & 0xFF
    
      this.writeUInt8(b0)
      this.writeUInt8(b1)
      this.writeUInt8(b2)
      this.writeUInt8(b3)
    }
    Writer.prototype.writeInt32 = Writer.prototype.writeUInt32
    
    
    Writer.prototype.writeBytes = function(arr) {
      this.buffer = this.buffer.concat(Array.prototype.slice.call(arr, 0))
    }
    
    Writer.prototype.writeString = function(str) {
      var i, len = str.length, arr = []
      for (i=0; i < len; i++) {
        arr.push(str.codePointAt(i))
      }
      this.writeBytes(arr)
    }
    
    Writer.prototype.writeVarInt = function(v) {
      if (v < 0) throw "Cannot write negative variable-length integer"
    
      if (v <= 0x7F) {
        this.writeUInt8(v)
      } else {
        var i = v
        var bytes = []
        bytes.push(i & 0x7F)
        i >>= 7
        while (i) {
          var b = i & 0x7F | 0x80
          bytes.push(b)
          i >>= 7
        }
        this.writeBytes(bytes.reverse())
      }
    }
    
    Writer.prototype.writeChunk = function(id, data) {
      this.writeString(id)
      this.writeUInt32(data.length)
      this.writeBytes(data)
    }
    
    module.exports = writeMidi
    
    },{}]},{},[1]);
    