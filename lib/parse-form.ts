import { IncomingForm } from 'formidable';
import { mkdir, stat } from 'fs/promises';
import * as fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Type des fichiers après parsing
export interface FormidableFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

/**
 * Convertit une Request Next.js en stream lisible pour formidable
 */
async function requestToStream(request: Request): Promise<Readable> {
  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  
  // Ajouter des propriétés nécessaires pour formidable
  const headers = {} as Record<string, string>;
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  (stream as any).headers = headers;
  
  return stream;
}

/**
 * Parse un formulaire multipart avec formidable
 */
export const parseForm = async (request: Request): Promise<{ fields: any; files: Record<string, FormidableFile[]> }> => {
  // S'assurer que le répertoire d'upload existe
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  try {
    await stat(uploadDir);
  } catch (e) {
    if ((e as any).code === 'ENOENT') {
      await mkdir(uploadDir, { recursive: true });
    } else {
      console.error('Error checking uploads directory:', e);
      throw e;
    }
  }
  
  return new Promise<{ fields: any; files: Record<string, FormidableFile[]> }>((resolve, reject) => {
    try {
      const contentType = request.headers.get('content-type') || '';
      
      // Vérifier si c'est bien un formulaire multipart
      if (!contentType.includes('multipart/form-data')) {
        reject(new Error('Not a multipart form'));
        return;
      }
      
      // Utiliser IncomingForm de formidable
      const form = new IncomingForm({
        uploadDir,
        keepExtensions: true,
        multiples: true,
      });
      
      // Convertir la requête Next.js en stream lisible pour formidable
      requestToStream(request).then(stream => {
        form.parse(stream, (err, fields, files) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Convertir les fichiers en tableau pour uniformiser l'interface
          const formattedFiles: Record<string, FormidableFile[]> = {};
          
          Object.keys(files).forEach(key => {
            const file = files[key];
            
            // Si le fichier est déjà un tableau, utiliser tel quel
            if (Array.isArray(file)) {
              formattedFiles[key] = file as unknown as FormidableFile[];
            } else {
              // Convertir en tableau d'un seul élément
              formattedFiles[key] = [file as unknown as FormidableFile];
            }
          });
          
          resolve({
            fields,
            files: formattedFiles
          });
        });
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Lire un fichier en base64
 */
export const readFileAsBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.toString('base64'));
    });
  });
};