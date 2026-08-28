import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Typography / Colors
    content = content.replace('text-ink-deep', 'text-foreground')
    content = content.replace('text-ink', 'text-foreground')
    content = content.replace('text-steel', 'text-muted-foreground')
    content = content.replace('text-slate', 'text-muted-foreground')
    content = content.replace('border-hairline-soft', 'border-border/50')
    content = content.replace('border-hairline', 'border-border')
    
    # Cards and Surfaces
    if not (filepath.endswith('layout.tsx') or filepath.endswith('page.tsx') or 'main-layout' in filepath):
        content = content.replace('bg-canvas', 'bg-card')
    
    content = content.replace('bg-surface-soft', 'bg-card')
    
    # Radii
    content = content.replace('rounded-xxxl', 'rounded-xl')
    content = content.replace('rounded-2xl', 'rounded-lg')
    content = content.replace('rounded-xl', 'rounded-lg')

    # Spacing
    content = content.replace('p-section-sm', 'p-6')
    content = content.replace('p-section', 'p-8')
    content = content.replace('mb-xl', 'mb-6')
    content = content.replace('mb-xxl', 'mb-8')

    # Buttons
    content = content.replace('button-buy-cta', 'bg-primary text-white hover:bg-primary/90 font-semibold rounded-md px-4 py-2 shadow-sm transition-colors flex items-center justify-center')
    content = content.replace('button-icon-circular', 'p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors')

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = os.path.join(os.getcwd(), 'src')
    modified_count = 0
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                if process_file(filepath):
                    modified_count += 1
                    
    print(f"Modified {modified_count} files.")

if __name__ == '__main__':
    main()
