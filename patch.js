const fs = require('fs');
let content = fs.readFileSync('src/components/posts/PostComposer.tsx', 'utf8');
const replacement = '<textarea\n value={content}\n onChange={(e) => handleContentChange(e.target.value)}\n placeholder="What\'s on your mind?"\n maxLength={maxLength}\n disabled={isSubmitting}\n className="w-full min-h-[80px] bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-[17px] text-foreground placeholder:text-muted-foreground py-2"\n/>';
content = content.replace(/<RichTextEditor[\s\S]*?\/>/, replacement);
fs.writeFileSync('src/components/posts/PostComposer.tsx', content, 'utf8');