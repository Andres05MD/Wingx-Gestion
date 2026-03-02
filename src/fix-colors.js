const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('/home/juan/Documentos/Programacion/Javascript y Typescript/Wingx/wingx-gestion/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Reemplazar botones primarios (gradient azul) -> bg-white text-black
    content = content.replace(/bg-gradient-to-(?:r|br)\s+from-blue-600\s+to-cyan-600\s+hover:from-blue-500\s+hover:to-cyan-500\s+text-white/g,
        'bg-white text-black hover:bg-zinc-200');
    // Variante sin hover
    content = content.replace(/bg-gradient-to-(?:r|br)\s+from-blue-600\s+to-cyan-500\s+text-white/g,
        'bg-white text-black');
    content = content.replace(/bg-gradient-to-(?:r|br)\s+from-blue-600\s+to-cyan-500/g,
        'bg-white text-black');

    // 2. Iconos de cabecera con fondos de colores (emerald, purple, amber, pink) -> monocromaticos
    content = content.replace(/bg-gradient-to-br\s+from-(\w+)-500\s+to-(\w+)-[4|5|6]00/g, 'bg-zinc-900 border border-zinc-800');
    content = content.replace(/bg-gradient-to-br\s+from-(\w+)-600\s+to-(\w+)-[4|5|6]00/g, 'bg-zinc-900 border border-zinc-800');
    content = content.replace(/bg-gradient-to-r\s+from-(\w+)-500\s+to-(\w+)-[4|5|6]00/g, 'bg-zinc-900 border border-zinc-800');
    content = content.replace(/bg-gradient-to-r\s+from-(\w+)-600\s+to-(\w+)-[4|5|6]00/g, 'bg-zinc-900 border border-zinc-800');

    // 3. Botones secundarios/acciones (edit, view, etc) 
    // bg-blue-500/10 border-blue-500/20 text-blue-400
    content = content.replace(/bg-blue-500\/10 border(?: border-blue-500\/20)? text-blue-400 hover:bg-blue-500\/20 hover:border-blue-500\/40 hover:text-blue-300/g,
        'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white');
    content = content.replace(/bg-blue-500\/10 border(?: border-blue-500\/20)? text-blue-400/g,
        'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white');

    // Los rojos (delete) los dejamos igual porque el danger es comun

    // 4. Textos de colores vivos (emerald para precios, blue para acentos comunes) -> white
    content = content.replace(/text-emerald-400/g, 'text-zinc-100');
    content = content.replace(/text-cyan-400/g, 'text-zinc-100');
    content = content.replace(/text-purple-400/g, 'text-zinc-100');
    content = content.replace(/text-amber-400/g, 'text-zinc-100');
    content = content.replace(/text-pink-400/g, 'text-zinc-100');

    // 5. Sombras de color (shadow-blue-500/20 etc)
    content = content.replace(/shadow-(\w+)-500\/\d+/g, 'shadow-black/40');
    content = content.replace(/shadow-(\w+)-600\/\d+/g, 'shadow-black/40');

    fs.writeFileSync(file, content, 'utf8');
});

console.log("Done");
