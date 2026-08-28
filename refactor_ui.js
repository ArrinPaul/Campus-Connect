const fs = require('fs');
const path = require('path');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const originalContent = content;

    // Typography / Colors
    content = content.replace(/text-ink-deep/g, 'text-foreground');
    content = content.replace(/text-ink/g, 'text-foreground');
    content = content.replace(/text-steel/g, 'text-muted-foreground');
    content = content.replace(/text-slate/g, 'text-muted-foreground');
    content = content.replace(/border-hairline-soft/g, 'border-border/50');
    content = content.replace(/border-hairline/g, 'border-border');
    
    // Cards and Surfaces
    if (!filepath.endsWith('layout.tsx') && !filepath.endsWith('page.tsx') && !filepath.includes('main-layout')) {
        content = content.replace(/bg-canvas/g, 'bg-card');
    }
    
    content = content.replace(/bg-surface-soft/g, 'bg-card');
    
    // Radii
    content = content.replace(/rounded-xxxl/g, 'rounded-xl');
    content = content.replace(/rounded-2xl/g, 'rounded-lg');
    content = content.replace(/rounded-xl/g, 'rounded-lg');

    // Spacing
    content = content.replace(/p-section-sm/g, 'p-6');
    content = content.replace(/p-section/g, 'p-8');
    content = content.replace(/mb-xl/g, 'mb-6');
    content = content.replace(/mb-xxl/g, 'mb-8');

    // Buttons
    content = content.replace(/button-buy-cta/g, 'bg-primary text-white hover:bg-primary/90 font-semibold rounded-md px-4 py-2 shadow-sm transition-colors flex items-center justify-center');
    content = content.replace(/button-icon-circular/g, 'p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors');

    if (content !== originalContent) {
        fs.writeFileSync(filepath, content, 'utf8');
        return true;
    }
    return false;
}

function walkSync(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        let dirPath = path.join(dir, file);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkSync(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

function main() {
    const srcDir = path.join(process.cwd(), 'src');
    let modifiedCount = 0;
    
    walkSync(srcDir, (filepath) => {
        if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
            if (processFile(filepath)) {
                modifiedCount++;
            }
        }
    });
    
    console.log(`Modified ${modifiedCount} files.`);
}

main();
