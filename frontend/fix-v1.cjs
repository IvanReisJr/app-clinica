const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}
walk('c:/IvanReis/Projetos/Pessoal/Clinica/app_clinica/frontend/src').forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    const usageRegex = /apiClient\.(get|post|put|patch|delete)\('v1\//g;
    if (usageRegex.test(content)) {
        content = content.replace(usageRegex, 'apiClient.$1(\'');
        changed = true;
    }
    const usageRegex2 = /apiClient\.(get|post|put|patch|delete)\(`v1\//g;
    if (usageRegex2.test(content)) {
        content = content.replace(usageRegex2, 'apiClient.$1(`');
        changed = true;
    }
    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed v1/: ' + file);
    }
});
