const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir(path.join(__dirname, 'src'));
let changedFiles = 0;

files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    content = content.replace(/import\s*\{\s*auth\s*\}\s*from\s*["']@\/lib\/auth\/client["']/g, 'import { auth } from "@/lib/auth/server"');
    content = content.replace(/import\s*\{\s*currentUser\s*\}\s*from\s*["']@\/lib\/auth\/client["']/g, 'import { currentUser } from "@/lib/auth/server"');
    
    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
});

console.log(`Successfully fixed imports in ${changedFiles} files!`);
