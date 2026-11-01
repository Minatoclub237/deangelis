// node tools/txt.cjs fichier.html : texte visible, liens et images d'une page
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
const t=h.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<\/(p|div|h\d|li|section|a|br)>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#8217;/g,"'").replace(/&#039;/g,"'").replace(/[ \t]+/g,' ').split('\n').map(s=>s.trim()).filter(Boolean);
const seen=new Set();console.log(t.filter(s=>!seen.has(s)&&seen.add(s)).join('\n').slice(0,+process.argv[3]||7000));
const urls=(re)=>[...new Set([...h.matchAll(re)].map(m=>m[1]))];
console.log('\n== LIENS');console.log(urls(/href=["']([^"'#]+)["']/gi).filter(u=>!/\.(css|js|ico|woff2?|xml)(\?|$)|wp-json|oembed|\/feed/.test(u)).slice(0,50).join('\n'));
console.log('\n== IMAGES');console.log([...new Set([...h.matchAll(/https?:[^"'\s)]+?\.(?:jpe?g|png|webp|svg|gif)/gi)].map(m=>m[0]).concat(urls(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi)))].slice(0,80).join('\n'))
