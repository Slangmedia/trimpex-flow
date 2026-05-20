import os
import re

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            
            # Replace \${ with ${
            new_content = content.replace('\\${', '${')
            # Replace \` with `
            new_content = new_content.replace('\\`', '`')
            
            if new_content != content:
                print(f"Fixed {path}")
                with open(path, 'w') as file:
                    file.write(new_content)
