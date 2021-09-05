// js version: Copyright 2019 Takeshi Okamoto (Japan)
// https://github.com/TakeshiOkamoto/WAVE.js/blob/3ecfdf7f14b294ba43bb5b79ef395bb3e7552355/WAVE.js

/**
 * 
 *   *** SPECIFICATION ***
 * 
 *   It corresponds to general Wave file.
 *   ( 一般的なWaveファイルに対応しています。 )
 * 
 *   --- Read
 *    unsigned 8bit [PCM]
 *    Signed 16bit  [PCM]
 *    Signed 24bit  [PCM]
 *    Signed 32bit  [PCM]
 *    32bit float   [IEEE Float]
 * 
 *   --- Write
 *    unsigned 8bit [PCM]
 *    Signed 16bit  [PCM]
 *    Signed 24bit  [PCM]
 *    Signed 32bit  [PCM]
 * 
 * 
 *   --- Not supported.
 *   Wave Format Extensible (WAVEX) is not supported.
 *   ( WAVEXは未対応です。必要であれば各自で対応して下さい。 )
 * 
 */

////////////////////////////////////////////////////////////////////////////////
// Generic function
////////////////////////////////////////////////////////////////////////////////

type Data = {
  L: any[];
  R: any[];
}

// Byte Order
function WavByte2Word(PByteArray: Uint8Array): number {
  return (PByteArray[1] << 8 | PByteArray[0]);
}

function WavByte2DWord(PByteArray: Uint8Array): number {
  return (PByteArray[3] << 24 | PByteArray[2] << 16 | PByteArray[1] << 8 |  PByteArray[0]) ;
}

// Uint8からInt8へ
function WavSetInt8(x: number): number {
  if (128 == x) return 0;

  if (129 >= x) {
    return x -128;
  } else {
    return -(128 - x);
  }
}

// Int8からUint8へ
function WavSetUint8(x : number): number {
  if (0 == x) return 128;

  if (1 >= x) {
    return x + 128;
  } else {
    return 128 + x;
  }
}

// Uint16からInt16へ
// ※0 ～ 65535 から -32768 ～ 32767へ
function WavSetInt16(x: number): number {
  if (32768 <= x) {
    return  -(65536 - x);
  } else {
    return x;
  }
}

// Int16からUint16へ
// ※-32768 ～ 32767 から 0 ～ 65535へ
function WavSetUint16(x: number): number {
  if (0 <= x && 32767 >= x) {
    return x;
  } else {
    return 65536 + x;
  }
}

// Uint24からInt24へ
// ※0 ～ 16777215 から -8388608 ～ 8388607へ
function WavSetInt24(x: number): number{
  if (8388608 <= x) {
    return  -(16777216 - x);
  } else {
     return x;
  }
}

// Int24からUint24へ
// ※-8388608 ～ 8388607 から 0 ～ 16777215へ
function WavSetUint24(x: number): number {
  if (0 <= x && 8388607 >= x) {
    return x;
  } else {
    return 16777216 + x;
  }
}

// Uint32からInt32へ
// ※0 ～ 4294967296 から -2147483648 ～ 2147483647へ
function WavSetInt32(x: number): number{
  if (2147483648 <= x) {
    return  -(4294967296 - x);
  } else {
     return x;
  }
}

// Int32からUint32へ
// ※-2147483648 ～ 2147483647 から 0 ～ 4294967296へ
function WavSetUint32(x: number): number{
  if (0 <= x && 2147483647 >= x) {
    return x;
  } else {
    return 4294967296 + x;
  }
}

////////////////////////////////////////////////////////////////////////////////
// Generic class
////////////////////////////////////////////////////////////////////////////////

// ---------------------
//  TReadStream
// ---------------------
class TReadStream {
  Pos: number;
  Stream: Uint8Array;
  FileSize: number

  constructor(AStream: Uint8Array) {
    this.Pos = 0;
    this.Stream = AStream;
    this.FileSize = AStream.length;
  }

  Read(ReadByteCount: number) {
    var P = this.Stream.subarray(this.Pos, this.Pos + ReadByteCount);
    this.Pos = this.Pos + ReadByteCount;
    return P;
  }

  ReadString(ReadByteCount: number) {
    var P = String.fromCharCode.apply(
      null,
      Array.from(this.Stream.subarray(this.Pos, this.Pos + ReadByteCount))
    );
    this.Pos = this.Pos + ReadByteCount;
    return P;
  }
}

// ---------------------
//  TFileStream
// ---------------------
class TFileStream {

  MemorySize: number;
  Size: number;
  Stream: Uint8Array;

  constructor(BufferSize: string|undefined) {

    if (BufferSize == undefined)
      this.MemorySize = 50000000; // 50M
    else
      this.MemorySize = parseInt(BufferSize, 10);

    this.Size = 0;
    this.Stream = new Uint8Array(this.MemorySize);
  }

  _AsciiToUint8Array(S: string) {
    const len = S.length;
    const P = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      P[i] = S[i].charCodeAt(0);
    }
    return P;
  }

  WriteByte(value: number) {
    const P = new Uint8Array(1);

    P[0] = value;

    this.WriteStream(P);
  }

  WriteWord(value: number) {
    const P = new Uint8Array(2);

    P[1] = (value & 0xFF00) >> 8;
    P[0] = (value & 0x00FF);

    this.WriteStream(P);
  }

  WriteDWord(value: number) {
    const P = new Uint8Array(4);

    P[3] = (value & 0xFF000000) >> 24;
    P[2] = (value & 0x00FF0000) >> 16;
    P[1] = (value & 0x0000FF00) >> 8;
    P[0] = (value & 0x000000FF);

    this.WriteStream(P);
  }

  WriteWord_Big(value: number) {
    const P = new Uint8Array(2);

    P[1] = (value & 0x00FF);
    P[0] = (value & 0xFF00) >> 8;

    this.WriteStream(P);
  }

  WriteDWord_Big(value: number) {
    const P = new Uint8Array(4);

    P[3] = (value & 0x000000FF)
    P[2] = (value & 0x0000FF00) >> 8;
    P[1] = (value & 0x00FF0000) >> 16;
    P[0] = (value & 0xFF000000) >> 24;

    this.WriteStream(P);
  }

  WriteString(S: string) {
    const P = this._AsciiToUint8Array(S);

    // メモリの再編成
    if (this.Stream.length <= (this.Size + P.length)) {
      const B = new Uint8Array(this.Stream);
      this.Stream = new Uint8Array(this.Size + P.length + this.MemorySize);
      this.Stream.set(B.subarray(0, B.length));
    }

    this.Stream.set(P, this.Size);
    this.Size = this.Size + P.length;
  }

  WriteStream(AStream: Uint8Array) {

    // メモリの再編成
    if (this.Stream.length <= (this.Size + AStream.length)) {
      const B = new Uint8Array(this.Stream);
      this.Stream = new Uint8Array(this.Size + AStream.length + this.MemorySize);
      this.Stream.set(B.subarray(0, B.length));
    }

    this.Stream.set(AStream, this.Size);
    this.Size = this.Size + AStream.length;
  }

  getFileSize() {
    return this.Size;
  }

}

////////////////////////////////////////////////////////////////////////////////
// Wave class
////////////////////////////////////////////////////////////////////////////////

// ---------------------
//  TWaveAnalyst
// ---------------------

type WAVE_FORMAT = {
  wFormatTag: number; 
  nChannels: number;
  nSamplesPerSec: number;
  nAvgBytesPerSec: number;
  nBlockAlign: number;
  wBitsPerSample: number;
};
class TWaveAnalyst {

  WaveFomat: WAVE_FORMAT;
  raw: Uint8Array;
  time: number;
  bps: number;

  constructor(PByteArray: Uint8Array) {

    const errormsg = "It is not a WAVE file.";
    const stream =  new TReadStream(PByteArray);

    // RIFF
    let magic = stream.ReadString(4);
    if (magic != "RIFF") {
      throw errormsg;
    }
    stream.Read(4);

    // WAVE
    magic = stream.ReadString(4);
    if (magic != "WAVE") {
      throw errormsg;
    }

    // fmt
    let len
    const WaveFomat = {} as WAVE_FORMAT;
    while(true) {
      magic = stream.ReadString(4);
      if (magic == "fmt ") {
        len = WavByte2DWord(stream.Read(4));

        // 種類(1:リニアPCM)
        WaveFomat.wFormatTag = WavByte2Word(stream.Read(2));
        // チャンネル数(1:モノラル 2:ステレオ)
        WaveFomat.nChannels = WavByte2Word(stream.Read(2));
        // サンプリングレート(44100=44.1kHzなど)
        WaveFomat.nSamplesPerSec = WavByte2DWord(stream.Read(4));
        // 平均データ転送レート(byte/sec)
        // ※PCMの場合はnSamplesPerSec * nBlockAlign
        WaveFomat.nAvgBytesPerSec = WavByte2DWord(stream.Read(4));
        // ブロックサイズ
        // ※PCMの場合はwBitsPerSample * nChannels / 8
        WaveFomat.nBlockAlign = WavByte2Word(stream.Read(2));
        // サンプルあたりのビット数 (bit/sample)
        // ※PCMの場合は8bit=8, 16bit =16
        WaveFomat.wBitsPerSample = WavByte2Word(stream.Read(2));

        // WaveFomatExなどの対策
        stream.Pos = stream.Pos + len - 16;

        break;
      } else {
        len = WavByte2DWord(stream.Read(4));
        stream.Pos += len;
      }

      if (stream.Pos >= stream.FileSize) {
        throw errormsg;
      }
    }

    // data
    let raw;
    while(true) {
      magic = stream.ReadString(4);
      if (magic == "data") {
        len = WavByte2DWord(stream.Read(4));
        raw = stream.Stream.subarray(stream.Pos,stream.Pos + len);

        break;
      } else {
        len = WavByte2DWord(stream.Read(4));
        stream.Pos += len;
      }

      if (stream.Pos >= stream.FileSize) {
        throw errormsg;
      }
    }

    // WaveFomat構造体(アクセス用)
    this.WaveFomat = WaveFomat;
    // 波形データ
    this.raw = raw;
    // 再生時間 (ms)
    this.time = 1000 * len / WaveFomat.nAvgBytesPerSec;
    // ビットレート (bps)
    this.bps = WaveFomat.nSamplesPerSec * WaveFomat.wBitsPerSample * WaveFomat.nChannels;
  }
}

// ---------------------
//  TWaveFormat
// ---------------------
export class TWaveFormat {

  Analyst: TWaveAnalyst;
  constructor(PByteArray: Uint8Array) {

    // ファイルの解析
    try{
      this.Analyst = new TWaveAnalyst(PByteArray);
    }catch(e) {
      throw(e);
    }
  }

  // 波形データを取得する
  getData(): Data {

    // PCM(8/16/24/32bit)及びIEEE Float(32bit)のみ対応
    if (!(this.Analyst.WaveFomat.wFormatTag == 1 ||
        (this.Analyst.WaveFomat.wFormatTag == 3 && this.Analyst.WaveFomat.wBitsPerSample == 32))) {
      throw 'It is an unsupported format.';
    }

    var index;
    const data: Data = {L: [], R: []};
    switch (this.Analyst.WaveFomat.wBitsPerSample) {

      // 8bit 0 ～ 255、無音は128
      case 8 :
            // モノラル
            if (this.Analyst.WaveFomat.nChannels == 1) {
              for(let i = 0;i<this.Analyst.raw.length;i++) {
                data.L.push(this.Analyst.raw[i]);
              }
              // 符号なしから符号ありに変換
              for(let i = 0;i<data.L.length;i++) {
                data.L[i] = WavSetInt8(data.L[i]);
              }
            // ステレオ
            } else {
              for(let i = 0;i<this.Analyst.raw.length;i++) {
                if (i % 2 == 0) {
                  data.L.push(this.Analyst.raw[i]);
                } else {
                  data.R.push(this.Analyst.raw[i]);
                }
              }
              // 符号なしから符号ありに変換
              for(let i = 0;i<data.L.length;i++) {
                data.L[i] = WavSetInt8(data.L[i]);
                data.R[i] = WavSetInt8(data.R[i]);
              }
            }
            break;

      // 16bit -32768 ～ +32767、無音は0
      case 16 :
            if (this.Analyst.WaveFomat.nChannels == 1) {
              for(let i = 0;i<this.Analyst.raw.length/2;i++) {
                index = i * 2;
                data.L.push((this.Analyst.raw[index+1] << 8) | this.Analyst.raw[index]);
              }
              for(let i = 0;i<data.L.length;i++) {
                data.L[i] = WavSetInt16(data.L[i]);
              }
            } else {
              for(let i = 0;i<this.Analyst.raw.length/2;i++) {
                index = i * 2;
                if (i % 2 == 0) {
                  data.L.push((this.Analyst.raw[index+1] << 8) | this.Analyst.raw[index]);
                } else {
                  data.R.push((this.Analyst.raw[index+1] << 8) | this.Analyst.raw[index]);
                }
              }
              for(let i = 0;i<data.L.length;i++) {
                data.L[i] = WavSetInt16(data.L[i]);
                data.R[i] = WavSetInt16(data.R[i]);
              }
            }
            break;

      // 24bit -8388608 ～ 8388607、無音は0
      case 24 :
            if (this.Analyst.WaveFomat.nChannels == 1) {
              for(let i = 0;i<this.Analyst.raw.length/3;i++) {
                index = i * 3;
                data.L.push( this.Analyst.raw[index]          |
                            (this.Analyst.raw[index+1] << 8 ) |
                            (this.Analyst.raw[index+2] << 16));
              }
              for(let i = 0;i<data.L.length;i++) {
                data.L[i] = WavSetInt24(data.L[i]);
              }
            } else {
              for(let i = 0;i<this.Analyst.raw.length/3;i++) {
                index = i * 3;
                if (i % 2 == 0) {
                  data.L.push( this.Analyst.raw[index]          |
                              (this.Analyst.raw[index+1] << 8)  |
                              (this.Analyst.raw[index+2] << 16));
                } else {
                  data.R.push( this.Analyst.raw[index]          |
                              (this.Analyst.raw[index+1] << 8)  |
                              (this.Analyst.raw[index+2] << 16));
                }
              }
              for(let i = 0;i<data.L.length;i++) {
                data.L[i] = WavSetInt24(data.L[i]);
                data.R[i] = WavSetInt24(data.R[i]);
              }
            }
            break;


      case 32 :
            // [PCM] 32bit -2147483648 ～ 2147483647、無音は0
            if (this.Analyst.WaveFomat.wFormatTag == 1) {
              if (this.Analyst.WaveFomat.nChannels == 1) {
                for(let i = 0;i<this.Analyst.raw.length/4;i++) {
                  index = i * 4;
                  data.L.push( this.Analyst.raw[index]          |
                              (this.Analyst.raw[index+1] << 8 ) |
                              (this.Analyst.raw[index+2] << 16) |
                              (this.Analyst.raw[index+3] << 24)
                        );
                }
                for(let i = 0;i<data.L.length;i++) {
                  data.L[i] = WavSetInt32(data.L[i]);
                }
              } else {
                for(let i = 0;i<this.Analyst.raw.length/4;i++) {
                  index = i * 4;
                  if (i % 2 == 0) {
                    data.L.push( this.Analyst.raw[index]          |
                                (this.Analyst.raw[index+1] << 8 ) |
                                (this.Analyst.raw[index+2] << 16) |
                                (this.Analyst.raw[index+3] << 24)
                          );
                  } else {
                    data.R.push( this.Analyst.raw[index]          |
                                (this.Analyst.raw[index+1] << 8 ) |
                                (this.Analyst.raw[index+2] << 16) |
                                (this.Analyst.raw[index+3] << 24)
                          );
                  }
                }
                for(let i = 0;i<data.L.length;i++) {
                  data.L[i] = WavSetInt32(data.L[i]);
                  data.R[i] = WavSetInt32(data.R[i]);
                }
              }

            // [IEEE Float] 32bit -1 ～ 1、無音は0
            } else {
              let val;
              const dataView = new DataView(new ArrayBuffer(4));

              if (this.Analyst.WaveFomat.nChannels == 1) {
                for(let i = 0;i<this.Analyst.raw.length/4;i++) {
                  index = i * 4;
                  dataView.setUint32(0,
                                     this.Analyst.raw[index]          |
                                    (this.Analyst.raw[index+1] << 8 ) |
                                    (this.Analyst.raw[index+2] << 16) |
                                    (this.Analyst.raw[index+3] << 24), false);

                  val = dataView.getFloat32(0);
                  if (val >= 0) {
                    val = val * 2147483647;
                  } else {
                    val = val * 2147483648;
                  }
                  data.L.push(val);
                }
                for(let i = 0;i<data.L.length;i++) {
                  data.L[i] = WavSetInt32(data.L[i]);
                }
              } else {
                for(let i = 0;i<this.Analyst.raw.length/4;i++) {
                  index = i * 4;
                  if (i % 2 == 0) {
                    dataView.setUint32(0,
                                       this.Analyst.raw[index]          |
                                      (this.Analyst.raw[index+1] << 8 ) |
                                      (this.Analyst.raw[index+2] << 16) |
                                      (this.Analyst.raw[index+3] << 24), false);

                    val = dataView.getFloat32(0);
                    if (val >= 0) {
                      val = val * 2147483647;
                    } else {
                      val = val * 2147483648;
                    }
                    data.L.push(val);
                  } else {
                    dataView.setUint32(0,
                                       this.Analyst.raw[index]          |
                                      (this.Analyst.raw[index+1] << 8 ) |
                                      (this.Analyst.raw[index+2] << 16) |
                                      (this.Analyst.raw[index+3] << 24), false);

                    val = dataView.getFloat32(0);
                    if (val >= 0) {
                      val = val * 2147483647;
                    } else {
                      val = val * 2147483648;
                    }
                    data.R.push(val);
                  }
                }
                for(let i = 0;i<data.L.length;i++) {
                  data.L[i] = WavSetInt32(data.L[i]);
                  data.R[i] = WavSetInt32(data.R[i]);
                }
              }
            }
            break;

      default : throw 'It is an unsupported format.';
    }
    return data;
  }

  // Waveファイルの生成
  WriteStream(bits: number, data: Data, frequency: number): TFileStream {

    // 符号ありから符号なしに変換
    if (bits == 8) {
      for(let i = 0;i<data.L.length;i++) {
        data.L[i] = WavSetUint8(data.L[i]);
      }
      for(let i = 0;i<data.R.length;i++) {
        data.R[i] = WavSetUint8(data.R[i]);
      }
    } else if (bits == 16) {
      for(let i = 0;i<data.L.length;i++) {
        data.L[i] = WavSetUint16(data.L[i]);
      }
      for(let i = 0;i<data.R.length;i++) {
        data.R[i] = WavSetUint16(data.R[i]);
      }
    } else if (bits == 24) {
      for(let i = 0;i<data.L.length;i++) {
        data.L[i] = WavSetUint24(data.L[i]);
      }
      for(let i = 0;i<data.R.length;i++) {
        data.R[i] = WavSetUint24(data.R[i]);
      }
    } else if (bits == 32) {
      for(let i = 0;i<data.L.length;i++) {
        data.L[i] = WavSetUint32(data.L[i]);
      }
      for(let i = 0;i<data.R.length;i++) {
        data.R[i] = WavSetUint32(data.R[i]);
      }
    }

    // フォーマットの変更
    var WaveFomat: WAVE_FORMAT = {} as WAVE_FORMAT;

    WaveFomat.wFormatTag = 1;
    WaveFomat.wBitsPerSample = bits;
    WaveFomat.nSamplesPerSec = frequency;

    if (data.R.length == 0) {
      WaveFomat.nChannels = 1;
    } else {
      WaveFomat.nChannels = 2;
    }

    WaveFomat.nBlockAlign = WaveFomat.wBitsPerSample * WaveFomat.nChannels / 8;
    WaveFomat.nAvgBytesPerSec = WaveFomat.nSamplesPerSec * WaveFomat.nBlockAlign;

    var F = new TFileStream(undefined);

    // RIFFヘッダ
    F.WriteString("RIFF");

    // ファイルの全体サイズ
    // ※波形データのサイズ + 36byteのヘッダ情報
    F.WriteDWord((data.L.length + data.R.length) * (bits/ 8) + 36);

    // RIFFの種類(WAVE)
    F.WriteString("WAVE");

      // fmtチャンク
      F.WriteString("fmt ");

      // チャンクのバイト数
      F.WriteDWord(16);

      // 種類(1:リニアPCM)
      F.WriteWord(WaveFomat.wFormatTag);
      // チャンネル数(1:モノラル 2:ステレオ)
      F.WriteWord(WaveFomat.nChannels);
      // サンプリングレート(44100=44.1kHzなど)
      F.WriteDWord(WaveFomat.nSamplesPerSec);
      // 平均データ転送レート(byte/sec)
      // ※PCMの場合はnSamplesPerSec * nBlockAlign
      F.WriteDWord(WaveFomat.nAvgBytesPerSec);
      // ブロックサイズ
      // ※PCMの場合はwBitsPerSample * nChannels / 8
      F.WriteWord(WaveFomat.nBlockAlign);
      // サンプルあたりのビット数 (bit/sample)
      // ※PCMの場合は8bit=8, 16bit =16
      F.WriteWord(WaveFomat.wBitsPerSample);

      // dataチャンク
      F.WriteString("data");

      // 波形データのバイト数
      F.WriteDWord((data.L.length + data.R.length) * (bits/ 8));

      // 波形データ
      if (bits == 8) {
        if (data.R.length == 0) {
          for(let i = 0;i< data.L.length; i++) {
            F.WriteByte(data.L[i]);
          }
        } else {
          for(let i = 0;i< data.L.length; i++) {
            F.WriteByte(data.L[i]);
            F.WriteByte(data.R[i]);
          }
        }
      } else if (bits == 16) {
        if (data.R.length == 0) {
          for(let i = 0;i< data.L.length; i++) {
            F.WriteWord(data.L[i]);
          }
        } else {
          for(let i = 0;i< data.L.length; i++) {
            F.WriteWord(data.L[i]);
            F.WriteWord(data.R[i]);
          }
        }
      } else if (bits == 24) {
        if (data.R.length == 0) {
          for(let i = 0;i< data.L.length; i++) {
            F.WriteByte((data.L[i] & 0x0000FF) );
            F.WriteByte((data.L[i] & 0x00FF00) >> 8);
            F.WriteByte((data.L[i] & 0xFF0000) >>16);
          }
        } else {
          for(let i = 0;i< data.L.length; i++) {
            F.WriteByte((data.L[i] & 0x0000FF) );
            F.WriteByte((data.L[i] & 0x00FF00) >> 8);
            F.WriteByte((data.L[i] & 0xFF0000) >>16);

            F.WriteByte((data.R[i] & 0x0000FF) );
            F.WriteByte((data.R[i] & 0x00FF00) >> 8);
            F.WriteByte((data.R[i] & 0xFF0000) >>16);
          }
        }
      } else if (bits == 32) {
        if (data.R.length == 0) {
          for(let i = 0;i< data.L.length; i++) {
            F.WriteDWord(data.L[i]);
          }
        } else {
          for(let i = 0;i< data.L.length; i++) {
            F.WriteDWord(data.L[i]);
            F.WriteDWord(data.R[i]);
          }
        }
      }

      return F;
  }

  // ---------------------------------------------------------
  //  bits           : 8/16/24/32(bit)
  //  stereo         : stereo is true, monaural is false
  //  frequency      : sampling frequency(Hz)
  //  rawflg         : true is return Uint8Array
  SaveToStream(bits: number, stereo: boolean, frequency: number, rawflg: boolean) : Uint8Array|TFileStream {

    // --------------------------
    //  波形データの取得
    // --------------------------
    const data = this.getData();

    // --------------------------
    //  ステレオ/モノラル
    // --------------------------
    if (stereo) {
      // Copy
      if (data.R.length == 0) {
        data.R = data.L.slice(0);
      }
    } else {
      // Delete
      data.R = [];
    }

    // --------------------------
    //  リサンプリング
    //  (サンプリング周波数変換)
    // --------------------------
    if (frequency != this.Analyst.WaveFomat.nSamplesPerSec) {
      // 比率
      const ratio =  this.Analyst.WaveFomat.nSamplesPerSec / frequency;
      // 1チャンネルのサイズ ( bps / bits )
      const size = (frequency * (bits * 1) * this.Analyst.time / 1000) / bits;

      const tmpL = new Array(Math.floor(size));
      let index = 0;
      for (let i = 0;i< tmpL.length; i++) {
         index += ratio;
         tmpL[i] = data.L[Math.floor(index-1)];
      }
      data.L = tmpL;

      if (data.R.length != 0) {
        const tmpR = new Array(tmpL.length);
        index = 0
        for (let i = 0;i< tmpL.length; i++) {
           index += ratio;
           tmpR[i] = data.R[Math.floor(index-1)];
        }
        data.R = tmpR;
      }
    }

    // --------------------------
    //  ビット数の変更
    // --------------------------

    // 8bit
    if (bits == 8) {
      if (this.Analyst.WaveFomat.wBitsPerSample == 8) {
        // nop
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 16) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 8;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 8;
            data.R[i] = data.R[i] >> 8;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 24) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 16;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 16;
            data.R[i] = data.R[i] >> 16;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 32) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 24;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 24;
            data.R[i] = data.R[i] >> 24;
          }
        }
      }

    // 16bit
    } else if (bits == 16) {
      if (this.Analyst.WaveFomat.wBitsPerSample == 8) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 8;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 8;
            data.R[i] = data.R[i] << 8;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 16) {
        // nop
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 24) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 8;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 8;
            data.R[i] = data.R[i] >> 8;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 32) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 16;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 16;
            data.R[i] = data.R[i] >> 16;
          }
        }
      }

    // 24bit
    } else if (bits == 24) {
      if (this.Analyst.WaveFomat.wBitsPerSample == 8) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 16;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 16;
            data.R[i] = data.R[i] << 16;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 16) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 8;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 8;
            data.R[i] = data.R[i] << 8;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 24) {
        // nop
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 32) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 8;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] >> 8;
            data.R[i] = data.R[i] >> 8;
          }
        }
      }

    // 32bit
    } else if (bits == 32) {
      if (this.Analyst.WaveFomat.wBitsPerSample == 8) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 24;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 24;
            data.R[i] = data.R[i] << 24;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 16) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 16;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 16;
            data.R[i] = data.R[i] << 16;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 24) {
        if (data.R.length == 0) {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 8;
          }
        } else {
          for (let i = 0;i< data.L.length; i++) {
            data.L[i] = data.L[i] << 8;
            data.R[i] = data.R[i] << 8;
          }
        }
      } else if (this.Analyst.WaveFomat.wBitsPerSample == 32) {
        // nop
      }
    }

    var F = this.WriteStream(bits, data, frequency);
    if (rawflg) {
      return F.Stream.subarray(0, F.getFileSize());
    } else {
      return F;
    }
  }
}
