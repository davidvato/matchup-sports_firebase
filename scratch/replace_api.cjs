const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace fetch('http://localhost:3001/api...
  content = content.replace(/'http:\/\/localhost:3001\/api(.*?)'/g, '`${API_URL}$1`');
  // Replace fetch(`http://localhost:3001/api...
  content = content.replace(/`http:\/\/localhost:3001\/api(.*?)`/g, '`${API_URL}$1`');

  if (content !== original) {
    // Add import if not present
    if (!content.includes('import { API_URL }')) {
      // Find the last import line
      const importRegex = /import .* from '.*';\n/g;
      let lastMatch;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastMatch = match;
      }
      
      const importStmt = "import { API_URL } from '../config';\n";
      if (lastMatch) {
        const insertPos = lastMatch.index + lastMatch[0].length;
        content = content.slice(0, insertPos) + importStmt + content.slice(insertPos);
      } else {
        content = importStmt + content;
      }
    }
    
    // Fix paths based on file depth
    const depth = filePath.split(path.sep).length - srcDir.split(path.sep).length;
    if (depth === 1) {
       content = content.replace(/import \{ API_URL \} from '\.\.\/config';/, "import { API_URL } from './config';");
    } else if (depth === 3) {
       content = content.replace(/import \{ API_URL \} from '\.\.\/config';/, "import { API_URL } from '../../config';");
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  }
}

walk(srcDir);
