import { IncomingForm } from 'formidable';
import { mkdir, stat } from 'fs/promises';
import fs from 'fs';
import path from 'path';

/**
 * Parseur de formulaires avec upload de fichiers
 */
export const parseForm = async (req: Request) => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Vérifier si le répertoire existe, sinon le créer
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

  // Convertir en buffer pour pouvoir traiter le formulaire
  const data = await req.arrayBuffer();
  const buffer = Buffer.from(data);
  
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      multiples: true,
    });

    // Créer un objet pour simuler une requête HTTP pour formidable
    const mockReq = {
      headers: req.headers,
      pipe: (stream: any) => stream.end(buffer),
      on: (event: string, cb: Function) => {
        if (event === 'end') setTimeout(cb, 0);
        return mockReq;
      },
    };

    form.parse(mockReq as any, (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        reject(err);
        return;
      }
      
      // Normalisation des fichiers pour avoir un format standard
      const normalizedFiles: Record<string, any[]> = {};
      
      Object.keys(files).forEach(key => {
        const file = files[key];
        if (Array.isArray(file)) {
          normalizedFiles[key] = file;
        } else {
          normalizedFiles[key] = [file];
        }
      });
      
      resolve({ fields, files: normalizedFiles });
    });
  });
};

/**
 * Lit un fichier et retourne son contenu en base64
 */
export const getFileAsBase64 = (filePath: string): Promise<string> => {
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