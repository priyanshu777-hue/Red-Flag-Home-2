const fs = require('fs');
let html = fs.readFileSync('franchise.html', 'utf8');

const oldCode = `        for (const box of mp4boxfile.moov.traks[0].mdia.minf.stbl.stsd.entries) {
          if (box.avcC || box.hvcC || box.vpcC || box.av1C) {
            const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
            box.write(stream);
            description = new Uint8Array(stream.buffer, 8); 
            break;
          }
        }`;

const newCode = `        for (const box of mp4boxfile.moov.traks[0].mdia.minf.stbl.stsd.entries) {
          if (box.avcC || box.hvcC || box.vpcC || box.av1C) {
            const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
            if (box.avcC) box.avcC.write(stream);
            else if (box.hvcC) box.hvcC.write(stream);
            else if (box.vpcC) box.vpcC.write(stream);
            else if (box.av1C) box.av1C.write(stream);
            description = new Uint8Array(stream.buffer, 8); 
            break;
          }
        }`;

if (html.includes('box.write(stream);')) {
  html = html.replace(oldCode, newCode);
  fs.writeFileSync('franchise.html', html);
  console.log('Fixed avcC write.');
} else {
  console.log('Could not find code block.');
}
