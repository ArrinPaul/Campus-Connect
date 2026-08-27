const fs = require('fs');
const path = require('path');

const basePath = 'D:/ON Going Projects/ON Going Projects/Campus Connect';

// ALL source directories to fix
const targetDirs = [
    'src/components',
    'src/app/(dashboard)',
    'src/app/(auth)',
    'src/app/(onboarding)',
    'src/app/admin',
    'src/app/offline',
];

const replacements = [
    // Remove backdrop blur (glassmorphism)
    { regex: /\bbackdrop-blur(?:-[a-z0-9]+)?\b/g, replacement: '' },
    
    // Canvas alpha variants → surface-soft
    { regex: /\bbg-canvas\/(70|40|50|90|80|60)\b/g, replacement: 'bg-surface-soft' },
    
    // hover:bg-canvas-soft/X → hover:bg-canvas
    { regex: /\bhover:bg-canvas-soft\/(?:\d+)\b/g, replacement: 'hover:bg-canvas' },
    
    // bg-canvas-soft → bg-canvas
    { regex: /\bbg-canvas-soft\b/g, replacement: 'bg-canvas' },
    
    // hover:bg-surface-soft/50 → hover:bg-canvas
    { regex: /\bhover:bg-surface-soft\/(?:\d+)\b/g, replacement: 'hover:bg-canvas' },
    
    // bg-surface-soft/X → bg-surface-soft  
    { regex: /\bbg-surface-soft\/(?:\d+)\b/g, replacement: 'bg-surface-soft' },
    
    // canvas-soft as color modifier (text-canvas-soft etc)
    { regex: /\bcanvas-soft\b/g, replacement: 'canvas' },
    
    // canvas-parchment (completely invalid)
    { regex: /\bbg-canvas-parchment\b/g, replacement: 'bg-canvas' },
    { regex: /\btext-canvas-parchment\b/g, replacement: 'text-ink' },
    { regex: /\bhover:bg-canvas-parchment\b/g, replacement: 'hover:bg-canvas' },
    
    // Ink muted variants
    { regex: /\btext-ink-muted-48\b/g, replacement: 'text-slate' },
    { regex: /\bbg-ink-muted-48\b/g, replacement: 'bg-slate' },
    { regex: /\bink-muted-48\b/g, replacement: 'slate' },
    { regex: /\btext-ink-muted\b/g, replacement: 'text-slate' },
    
    // btn-press → active:scale
    { regex: /\bbtn-press\b/g, replacement: 'active:scale-[0.98]' },
    
    // Destructive → critical
    { regex: /\btext-destructive\b/g, replacement: 'text-critical' },
    { regex: /\bbg-destructive\b/g, replacement: 'bg-critical' },
    { regex: /\bborder-destructive\b/g, replacement: 'border-critical' },
    { regex: /\bhover:bg-destructive\b/g, replacement: 'hover:bg-critical' },
    { regex: /\bdestructive\/(\d+)\b/g, replacement: 'critical/$1' },
    
    // Body-strong
    { regex: /\btext-body-strong\b/g, replacement: 'font-semibold' },
    
    // Shadow aliases (valid now, but normalize rounded-md → rounded-xl for dropdowns/popover)
    // shadow-sticky-panel stays (valid now)
    
    // Legacy shadcn: foreground/muted/etc — keep but normalize explicit class usage
    // (These are now handled by CSS variables, so only fix explicit usage that's wrong)
    { regex: /\btext-foreground\b/g, replacement: 'text-ink-deep' },
    { regex: /\bbg-foreground\b/g, replacement: 'bg-ink-deep' },
    { regex: /\btext-accent-foreground\b/g, replacement: 'text-ink-deep' },
    { regex: /\bring-ring\b/g, replacement: 'ring-primary' },
    { regex: /\btext-primary-foreground\b/g, replacement: 'text-on-primary' },
    { regex: /\bborder-border\b/g, replacement: 'border-hairline' },
    
    // Spacing token overrides (py-lg, py-xl use custom spacing — keep)
    // These ARE valid in tailwind config, so don't replace them
    
    // Surface aliases 
    { regex: /\bbg-surface-alt\b/g, replacement: 'bg-canvas' },
    { regex: /\bbg-background\b/g, replacement: 'bg-canvas' },
    
    // Floating/glow classes (hide decorators)
    { regex: /\banimate-pulse-glow\b/g, replacement: '' },
    { regex: /\banimate-float\b/g, replacement: '' },
    { regex: /\bfloating-orb\b/g, replacement: 'hidden' },
];

let totalUpdated = 0;

function processFile(fullPath) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    
    for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
    }
    
    // Clean up multiple spaces within className strings
    content = content.replace(/ {2,}/g, ' ');
    // Clean up leading space in className
    content = content.replace(/className="( )/g, 'className="');
    content = content.replace(/ "/g, '"');
    
    if (content !== original) {
        console.log(`✓ Updated: ${fullPath.replace(basePath, '')}`);
        fs.writeFileSync(fullPath, content);
        totalUpdated++;
    }
}

function processDir(dirPath) {
    const fullDir = path.join(basePath, dirPath);
    if (!fs.existsSync(fullDir)) {
        console.log(`⚠ Skipped (not found): ${dirPath}`);
        return;
    }
    
    const items = fs.readdirSync(fullDir);
    for (const item of items) {
        const fullPath = path.join(fullDir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(path.join(dirPath, item).replace(/\\/g, '/'));
        } else if ((item.endsWith('.tsx') || item.endsWith('.ts')) && !item.endsWith('.test.tsx') && !item.endsWith('.d.ts')) {
            processFile(fullPath);
        }
    }
}

console.log('🔧 Campus Connect Apple Minimal Token Fixer\n');
for (const dir of targetDirs) {
    processDir(dir);
}
console.log(`\n✅ Done. ${totalUpdated} files updated.`);
