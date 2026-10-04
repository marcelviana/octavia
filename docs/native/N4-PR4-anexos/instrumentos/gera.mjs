import {readFileSync} from 'node:fs'
const b=readFileSync('docs/native/DESIGN-N4/telas.html','utf8')
const t=JSON.parse(/<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/.exec(b)[1])
const sec=t.slice(t.indexOf('data-screen-label="5 Ícones — decididos"'), t.indexOf('data-screen-label="5b'))
const fmt=(n)=>{const r=Math.round(n*1000)/1000; return String(Object.is(r,-0)?0:r)}
function escala(d,k){let s='',cmd='',i=0,prevNum=false
 for(const tk of d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)/g)){
  if(/[A-Za-z]/.test(tk)){cmd=tk;i=0;s+=tk;prevNum=false;continue}
  const fixo=cmd.toLowerCase()==='a'&&[2,3,4].includes(i%7)
  const v=fixo?tk:fmt(+tk*k); s+=(prevNum&&!v.startsWith('-')?' ':'')+v; prevNum=true; i++}
 return s}
const row=(id)=>{const m=new RegExp(`>${id}</td>([\\s\\S]*?)</tr>`).exec(sec); return [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c=>[...c[1].matchAll(/<svg [\s\S]*?<\/svg>/g)].map(s=>s[0]))}
const lista=(svg,{traco,escalar})=>{const g=/<g transform="scale\(([\d.]+)\)"/.exec(svg); const k=g?+g[1]:1
 return '['+[...svg.matchAll(/<path d="([^"]+)"([^>]*)>/g)].map(([,d,r])=>{const dd=escalar?escala(d,k):d; const cheio=/fill="#/.test(r)
  return `{ d: '${dd}'${cheio?', fill: true':''}${!cheio&&traco?`, traco: ${traco}`:''} }`}).join(', ')+']'}
for (const [id,nome] of [['P-I9','letra'],['P-I10','cifra'],['P-I11','tab'],['P-I12','partitura']]){
 const s=row(id)[2][0]
 console.log(`  '${nome}': {\n    normal: ${lista(s,{escalar:true})},\n    em20: ${lista(s,{escalar:true,traco:1.8})},\n  },`)
}
const a=row('P-I1a'), bb=row('P-I1b'), p=row('P-I2')
console.log(`  'estrela': {\n    normal: ${lista(a[1][0],{})},\n    ativo: ${lista(bb[1][0],{})},\n    inerte: ${lista(a[3][0],{traco:1.25})},\n    ativoInerte: ${lista(bb[3][0],{traco:1.25})},\n  },`)
console.log(`  'tocar': {\n    normal: ${lista(p[1][0],{})},\n    inerte: ${lista(p[3][0],{traco:1.25})},\n  },`)
