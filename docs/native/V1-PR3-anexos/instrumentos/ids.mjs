// lista resource-id + bounds + content-desc de um dump uiautomator
import { readFileSync } from 'node:fs'
for (const f of process.argv.slice(2)) {
  const xml = readFileSync(f, 'utf8')
  console.log('--', f.split('/').pop())
  for (const m of xml.matchAll(/<node\b([^>]*?)\/?>/g)) {
    const a = {}; for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]] = x[2]
    if (!a['resource-id'] && a.clickable !== 'true') continue
    const id = a['resource-id'] || '(sem id)'
    if (id.startsWith('android:') || id.startsWith('rocks.octavia')) continue
    console.log(`  ${id.padEnd(26)} ${a.bounds.padEnd(24)} click=${a.clickable === 'true' ? 1 : 0} desc=${JSON.stringify(a['content-desc'].slice(0, 60))}`)
  }
}
