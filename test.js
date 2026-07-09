const fs = require('fs');
const buffer = fs.readFileSync('Anton-Regular.ttf');
let binary = '';
const bytes = new Uint8Array(buffer);
const len = bytes.byteLength;
for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
}
console.log(btoa(binary).substring(0, 50));
console.log("SUCCESS!");
