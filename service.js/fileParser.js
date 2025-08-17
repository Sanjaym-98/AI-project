const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const cheerio = require("cheerio");
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

/**
 * Enhanced document parser supporting multiple file formats
 * Dependencies to install:
 * npm install pdf-parse mammoth cheerio officeparser node-pandoc rtf-parser
 */

async function parseDocumentToText(filePath, ext) {
  console.log('Parsing file:', filePath);
  
  // Normalize extension
  let type = ext.toLowerCase();
  if (type.startsWith('.')) {
    type = type.slice(1);
  } else if (type.includes('.')) {
    type = type.split(".")[1];
  }
  
  console.log('File type:', type);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  try {
    switch (type) {
      case 'pdf':
        return await parsePDF(filePath);
      
      case 'docx':
        return await parseDOCX(filePath);
      
      case 'doc':
        return await parseDOC(filePath);
      
      case 'txt':
        return await parseTXT(filePath);
      
      case 'rtf':
        return await parseRTF(filePath);
      
      case 'html':
      case 'htm':
        return await parseHTML(filePath);
      
      case 'odt':
        return await parseODT(filePath);
      
      case 'xlsx':
      case 'xls':
        return await parseExcel(filePath);
      
      case 'pptx':
      case 'ppt':
        return await parsePowerPoint(filePath);
      
      case 'csv':
        return await parseCSV(filePath);
      
      case 'xml':
        return await parseXML(filePath);
      
      case 'json':
        return await parseJSON(filePath);
      
      default:
        // Try generic text extraction as fallback
        return await parseGeneric(filePath);
    }
  } catch (error) {
    console.error(`Error parsing ${type} file:`, error.message);
    throw new Error(`Failed to parse ${type} document: ${error.message}`);
  }
}

// PDF Parser
async function parsePDF(filePath) {
  console.log("herea insode pdf")
  const buffer = await fs.readFile(filePath);
  console.log("buttgrer",buffer)
  const data = await pdfParse(buffer);
  console.log("data",data)
  return data.text;
}

// DOCX Parser
async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// DOC Parser (legacy Word documents)
async function parseDOC(filePath) {
  try {
    // Try using antiword if available
    const { stdout } = await execAsync(`antiword "${filePath}"`);
    return stdout;
  } catch (antiwordError) {
    console.log('Antiword not available, trying alternative methods...');
    
    try {
      // Try using pandoc if available
      const { stdout } = await execAsync(`pandoc "${filePath}" -t plain`);
      return stdout;
    } catch (pandocError) {
      console.log('Pandoc not available, trying LibreOffice...');
      
      try {
        // Try using LibreOffice headless conversion
        const tempDir = path.dirname(filePath);
        const fileName = path.basename(filePath, '.doc');
        
        await execAsync(`libreoffice --headless --convert-to txt --outdir "${tempDir}" "${filePath}"`);
        
        const txtFile = path.join(tempDir, `${fileName}.txt`);
        const content = await fs.readFile(txtFile, 'utf8');
        
        // Clean up temporary file
        try {
          await fs.unlink(txtFile);
        } catch (e) {}
        
        return content;
      } catch (libreOfficeError) {
        // Final fallback - try to read as binary and extract readable text
        console.log('All DOC extraction methods failed, trying binary extraction...');
        return await extractTextFromBinary(filePath);
      }
    }
  }
}

// TXT Parser
async function parseTXT(filePath) {
  return await fs.readFile(filePath, 'utf8');
}

// RTF Parser
async function parseRTF(filePath) {
  try {
    // Try with rtf-parser package (install: npm install rtf-parser)
    const RTFParser = require('rtf-parser');
    const content = await fs.readFile(filePath);
    
    return new Promise((resolve, reject) => {
      RTFParser.parseRtf(content.toString(), (err, doc) => {
        if (err) {
          reject(err);
        } else {
          // Extract plain text from RTF document
          let text = '';
          function extractText(element) {
            if (element.text) {
              text += element.text;
            }
            if (element.children) {
              element.children.forEach(extractText);
            }
          }
          extractText(doc);
          resolve(text);
        }
      });
    });
  } catch (rtfParserError) {
    console.log('RTF parser failed, trying manual extraction...');
    // Manual RTF text extraction
    const content = await fs.readFile(filePath, 'utf8');
    
    // Remove RTF control words and formatting
    let text = content
      .replace(/\{\\[^}]*\}/g, '') // Remove RTF control groups
      .replace(/\\[a-z]+\d*\s?/gi, '') // Remove RTF control words
      .replace(/[{}]/g, '') // Remove remaining braces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return text;
  }
}

// HTML Parser
async function parseHTML(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(content);
  
  // Remove script and style elements
  $('script, style').remove();
  
  return $('body').text() || $.text();
}

// ODT Parser (OpenDocument Text)
async function parseODT(filePath) {
  try {
    // Try using pandoc
    const { stdout } = await execAsync(`pandoc "${filePath}" -t plain`);
    return stdout;
  } catch (pandocError) {
    try {
      // Try using LibreOffice
      const tempDir = path.dirname(filePath);
      const fileName = path.basename(filePath, '.odt');
      
      await execAsync(`libreoffice --headless --convert-to txt --outdir "${tempDir}" "${filePath}"`);
      
      const txtFile = path.join(tempDir, `${fileName}.txt`);
      const content = await fs.readFile(txtFile, 'utf8');
      
      // Clean up
      try {
        await fs.unlink(txtFile);
      } catch (e) {}
      
      return content;
    } catch (libreOfficeError) {
      throw new Error('ODT parsing requires pandoc or LibreOffice to be installed');
    }
  }
}

// Excel Parser
async function parseExcel(filePath) {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_txt(worksheet);
      text += `Sheet: ${sheetName}\n${sheetText}\n\n`;
    });
    
    return text;
  } catch (xlsxError) {
    console.log('XLSX parser failed, trying LibreOffice...');
    
    try {
      const tempDir = path.dirname(filePath);
      const fileName = path.basename(filePath).replace(/\.(xlsx|xls)$/, '');
      
      await execAsync(`libreoffice --headless --convert-to csv --outdir "${tempDir}" "${filePath}"`);
      
      const csvFile = path.join(tempDir, `${fileName}.csv`);
      const content = await fs.readFile(csvFile, 'utf8');
      
      // Clean up
      try {
        await fs.unlink(csvFile);
      } catch (e) {}
      
      return content;
    } catch (libreOfficeError) {
      throw new Error('Excel parsing requires xlsx package or LibreOffice');
    }
  }
}

// PowerPoint Parser
async function parsePowerPoint(filePath) {
  try {
    // Try using pandoc
    const { stdout } = await execAsync(`pandoc "${filePath}" -t plain`);
    return stdout;
  } catch (pandocError) {
    try {
      // Try using LibreOffice
      const tempDir = path.dirname(filePath);
      const fileName = path.basename(filePath).replace(/\.(pptx|ppt)$/, '');
      
      await execAsync(`libreoffice --headless --convert-to txt --outdir "${tempDir}" "${filePath}"`);
      
      const txtFile = path.join(tempDir, `${fileName}.txt`);
      const content = await fs.readFile(txtFile, 'utf8');
      
      // Clean up
      try {
        await fs.unlink(txtFile);
      } catch (e) {}
      
      return content;
    } catch (libreOfficeError) {
      throw new Error('PowerPoint parsing requires pandoc or LibreOffice');
    }
  }
}

// CSV Parser
async function parseCSV(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return content;
}

// XML Parser
async function parseXML(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(content, { xmlMode: true });
  return $.text();
}

// JSON Parser
async function parseJSON(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const jsonData = JSON.parse(content);
  return JSON.stringify(jsonData, null, 2);
}

// Generic parser for unknown file types
async function parseGeneric(filePath) {
  try {
    // First try as UTF-8 text
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if it looks like readable text
    const printableChars = content.match(/[\x20-\x7E\n\r\t]/g);
    const printableRatio = printableChars ? printableChars.length / content.length : 0;
    
    if (printableRatio > 0.7) {
      return content;
    } else {
      // Try binary extraction
      return await extractTextFromBinary(filePath);
    }
  } catch (error) {
    throw new Error(`Unable to parse file as text: ${error.message}`);
  }
}

// Binary text extraction (fallback method)
async function extractTextFromBinary(filePath) {
  const buffer = await fs.readFile(filePath);
  
  // Extract printable ASCII characters
  let text = '';
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    // Include printable ASCII characters and common whitespace
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      text += String.fromCharCode(byte);
    } else if (byte === 0) {
      // Null bytes often separate words in binary formats
      text += ' ';
    }
  }
  
  // Clean up the extracted text
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/(.)\1{10,}/g, '$1') // Remove excessive character repetition
    .trim();
}

// Utility function to check if required system tools are available
async function checkSystemDependencies() {
  const tools = ['antiword', 'pandoc', 'libreoffice'];
  const available = {};
  
  for (const tool of tools) {
    try {
      await execAsync(`which ${tool}`);
      available[tool] = true;
    } catch (error) {
      available[tool] = false;
    }
  }
  
  return available;
}

// Export functions
module.exports = {
  parseDocumentToText,
  checkSystemDependencies,
  
  // Individual parsers for direct use
  parsePDF,
  parseDOCX,
  parseDOC,
  parseTXT,
  parseRTF,
  parseHTML,
  parseODT,
  parseExcel,
  parsePowerPoint,
  parseCSV,
  parseXML,
  parseJSON,
  parseGeneric
};