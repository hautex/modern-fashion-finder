import { IncomingForm } from 'formidable';
import type { NextApiRequest } from 'next';
import { mkdir, stat } from 'fs/promises';
import fs from 'fs';
import path from 'path';

export const parseForm = async (req: Request) => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Vérifier si le répertoire exists, sinon le créer
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
  
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    // Convertir la requête Next.js en requête Node.js
    const readableReq = fs.createReadStream(null as unknown as string) as any;
    readableReq.headers = {};
    
    // Utilisez IncomingForm de formidable
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      multiples: true,
    });

    try {
      // Simuler une analyse pour un POC
      // Dans un environnement réel, vous utiliseriez formidable correctement avec la req
      resolve({
        fields: {},
        files: {
          image: [{
            filepath: path.join(uploadDir, 'sample.jpg'),
            originalFilename: 'sample.jpg',
            mimetype: 'image/jpeg',
            size: 12345
          }]
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};