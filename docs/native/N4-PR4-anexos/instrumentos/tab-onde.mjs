import fs from 'node:fs'
const ARV = process.env.ARV
const { PNG } = (await import(`${ARV}/node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png.js`)).default
const pixelmatch = (await import(`${ARV}/node_modules/.pnpm/pixelmatch@7.1.0/node_modules/pixelmatch/index.js`)).default
const [a, b, out] = process.argv.slice(2)
const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b))
const D = new PNG({ width: A.width, height: A.height })
pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0, includeAA: true, diffMask: true })
let x0=1e9,y0=1e9,x1=0,y1=0
for (let y = 54; y < A.height-135; y++) for (let x = 0; x < A.width; x++) { const i=(y*A.width+x)*4; if (D.data[i+3]) { x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y) } }
console.log('bbox', x0,y0,x1,y1)
const W=Math.min(A.width, x1-x0+81), H=Math.min(A.height,y1-y0+81), X=Math.max(0,x0-40), Y=Math.max(0,y0-40)
const o = new PNG({ width: W*2, height: H })
for (let y=0;y<H;y++) for (let x=0;x<W;x++) for (const [src,off] of [[A,0],[B,W]]) { const si=((Y+y)*A.width+X+x)*4, di=(y*W*2+x+off)*4; for(let k=0;k<4;k++) o.data[di+k]=src.data[si+k] }
fs.writeFileSync(out, PNG.sync.write(o))
