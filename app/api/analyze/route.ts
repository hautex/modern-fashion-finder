import { NextResponse } from 'next/server';
import { parseForm } from '@/lib/parse-form';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Définition du type de réponse
export type AnalysisResponse = {
  attributes: {
    color: string;
    category: string;
    pattern: string;
    style: string;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    imageUrl: string;
    productUrl: string;
    source: string;
    similarity: number;
  }>;
};

export async function POST(request: Request) {
  try {
    // Parsing multipart form data
    const { fields, files } = await parseForm(request);
    
    // Vérifiez qu'un fichier a été téléchargé
    if (!files.image || !files.image[0]) {
      return NextResponse.json(
        { error: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    const file = files.image[0];
    
    // Dans une implémentation réelle, vous enverriez cette image à Google Vision API
    // Pour ce POC, nous simulons un délai et renvoyons des données fictives
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Générer une réponse fictive basée sur des catégories courantes
    const categories = ['robe', 't-shirt', 'pantalon', 'chemise', 'veste', 'pull'];
    const colors = ['#ff0000', '#0000ff', '#008000', '#000000', '#ffffff', '#ffc0cb'];
    const colorNames = ['rouge', 'bleu', 'vert', 'noir', 'blanc', 'rose'];
    const patterns = ['uni', 'rayé', 'à carreaux', 'imprimé', 'fleuri'];
    const styles = ['décontracté', 'élégant', 'sportif', 'formel', 'vintage'];
    
    // Sélection aléatoire d'attributs pour la démonstration
    const randomIndex = Math.floor(Math.random() * categories.length);
    const patternIndex = Math.floor(Math.random() * patterns.length);
    const styleIndex = Math.floor(Math.random() * styles.length);
    
    const category = categories[randomIndex];
    const colorIndex = randomIndex;
    const color = colors[colorIndex];
    const colorName = colorNames[colorIndex];
    const pattern = patterns[patternIndex];
    const style = styles[styleIndex];
    
    // Générer des produits fictifs basés sur les attributs
    const products = Array(8).fill(0).map((_, index) => {
      const similarity = 0.95 - (index * 0.05);
      
      return {
        id: uuidv4(),
        name: `${style.charAt(0).toUpperCase() + style.slice(1)} ${category} ${pattern} ${colorName}`,
        price: Math.floor(Math.random() * 50) + 19.99,
        currency: '€',
        imageUrl: `https://source.unsplash.com/random/300x400?${category},${colorName}`,
        productUrl: 'https://example.com/product',
        source: ['Zara', 'H&M', 'Mango', 'Uniqlo', 'Asos', 'Zalando', 'Bershka', 'Pull & Bear'][index],
        similarity: parseFloat(similarity.toFixed(2))
      };
    });
    
    // Construire et renvoyer la réponse
    const analysisResult: AnalysisResponse = {
      attributes: {
        color,
        category,
        pattern,
        style
      },
      products
    };

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'analyse de l\'image' },
      { status: 500 }
    );
  }
}