import { IncomingForm } from 'formidable';
import { mkdir, stat } from 'fs/promises';
import fs from 'fs';
import path from 'path';

// Type pour le fichier téléchargé
export interface UploadedFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

// Type pour les résultats du parsing de formulaire
export interface ParsedForm {
  fields: any;
  files: {
    [key: string]: UploadedFile[];
  };
}

/**
 * Parser un formulaire multipart depuis une requête
 */
export async function parseForm(req: Request): Promise<ParsedForm> {
  // Assurer que le dossier d'upload existe
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  try {
    await stat(uploadDir);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      await mkdir(uploadDir, { recursive: true });
    } else {
      console.error('Erreur lors de la vérification du dossier d\'uploads:', e);
      throw e;
    }
  }

  // Créer un Stream à partir des données de la requête
  const chunks = [];
  const readableStream = req.body;
  if (!readableStream) {
    throw new Error('Request body is not a readable stream');
  }
  
  // @ts-ignore - Next.js Request body can be read as a stream
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  
  const buffer = Buffer.concat(chunks);
  
  // Écrire temporairement le buffer dans un fichier
  const tempFilePath = path.join(uploadDir, `temp-${Date.now()}.bin`);
  fs.writeFileSync(tempFilePath, buffer);
  
  // Extraire le boundary du Content-Type header
  const contentType = req.headers.get('content-type') || '';
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  
  if (!boundaryMatch) {
    throw new Error('Could not determine form data boundary');
  }
  
  // Parser le formulaire avec formidable
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: true,
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });
    
    form.parse(fs.createReadStream(tempFilePath), (err: any, fields: any, files: any) => {
      // Supprimer le fichier temporaire
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Erreur lors de la suppression du fichier temporaire:', e);
      }
      
      if (err) {
        reject(err);
        return;
      }
      
      // Convertir les fichiers au format attendu
      const parsedFiles: { [key: string]: UploadedFile[] } = {};
      
      Object.keys(files).forEach(fieldName => {
        const fileArray = Array.isArray(files[fieldName]) ? files[fieldName] : [files[fieldName]];
        
        parsedFiles[fieldName] = fileArray.map(file => ({
          filepath: file.filepath,
          originalFilename: file.originalFilename || 'unknown',
          mimetype: file.mimetype || 'application/octet-stream',
          size: file.size || 0
        }));
      });
      
      resolve({
        fields,
        files: parsedFiles
      });
    });
  });
}

/**
 * Lire un fichier en Base64
 */
export function readFileAsBase64(filepath: string): string {
  const buffer = fs.readFileSync(filepath);
  return buffer.toString('base64');
}