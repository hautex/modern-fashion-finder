import { NextResponse } from 'next/server';
import { parseForm, readFileAsBase64 } from '@/lib/parse-form';
import { analyzeImageWithVision, extractClothingAttributes } from '@/lib/google-vision';
import { searchSimilarProducts, buildSearchQuery, Product } from '@/lib/google-search';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Définition du type de réponse
export type AnalysisResponse = {
  attributes: {
    color: string;
    colorName: string;
    category: string;
    pattern: string;
    style: string;
  };
  products: Product[];
};

export async function POST(request: Request) {
  try {
    // Parsing multipart form data
    const { fields, files } = await parseForm(request);
    
    // Vérifier qu'un fichier a été téléchargé
    if (!files.image || !files.image[0]) {
      return NextResponse.json(
        { error: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    console.log('Image reçue:', files.image[0].filepath);
    
    // Lire le fichier et le convertir en base64
    const imageBase64 = await readFileAsBase64(files.image[0].filepath);
    
    try {
      // 1. Analyser l'image avec Google Vision API
      console.log('Analyse de l\'image avec Google Vision API...');
      const visionResults = await analyzeImageWithVision(imageBase64);
      
      // 2. Extraire les caractéristiques du vêtement
      console.log('Extraction des caractéristiques du vêtement...');
      const clothingAttributes = extractClothingAttributes(visionResults);
      console.log('Caractéristiques détectées:', clothingAttributes);
      
      // 3. Construire une requête de recherche
      const searchQuery = buildSearchQuery(clothingAttributes);
      console.log('Requête de recherche construite:', searchQuery);
      
      // 4. Rechercher des produits similaires
      console.log('Recherche de produits similaires...');
      let products;
      try {
        products = await searchSimilarProducts(searchQuery);
      } catch (searchError) {
        console.error('Erreur lors de la recherche Google:', searchError);
        // Créer des produits fictifs en cas d'erreur
        products = generateFallbackProducts(clothingAttributes);
      }
      
      // 5. Construire et renvoyer la réponse
      const analysisResult: AnalysisResponse = {
        attributes: {
          color: clothingAttributes.color,
          colorName: clothingAttributes.colorName,
          category: clothingAttributes.category,
          pattern: clothingAttributes.pattern,
          style: clothingAttributes.style
        },
        products
      };

      console.log(`${products.length} produits trouvés`);
      return NextResponse.json(analysisResult);
    } catch (apiError) {
      console.error('Erreur API:', apiError);
      
      // Fallback: générer une réponse fictive en cas d'erreur avec les APIs
      const fallbackResponse = generateFallbackResponse();
      console.log('Utilisation de la réponse de secours');
      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'image:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'analyse de l\'image' },
      { status: 500 }
    );
  }
}

/**
 * Génère des produits fictifs basés sur les attributs détectés
 */
function generateFallbackProducts(attributes: {
  category: string;
  colorName: string;
  pattern: string;
  style: string;
}): Product[] {
  const brands = ['Zara', 'H&M', 'Mango', 'Uniqlo', 'Asos', 'Zalando', 'Bershka', 'Pull & Bear'];
  
  return Array(8).fill(0).map((_, index) => {
    const similarity = 0.95 - (index * 0.05);
    
    return {
      id: uuidv4(),
      name: `${attributes.style.charAt(0).toUpperCase() + attributes.style.slice(1)} ${attributes.category} ${attributes.pattern} ${attributes.colorName}`,
      brand: brands[index % brands.length],
      price: Math.floor(Math.random() * 50) + 19.99,
      currency: '€',
      imageUrl: `https://source.unsplash.com/random/300x400?${attributes.category},${attributes.colorName}`,
      productUrl: 'https://example.com/product',
      source: brands[index % brands.length],
      similarity: parseFloat(similarity.toFixed(2))
    };
  });
}

/**
 * Génère une réponse fictive complète en cas d'échec total
 */
function generateFallbackResponse(): AnalysisResponse {
  // Catégories de vêtements courantes
  const categories = ['t-shirt', 'chemise', 'pantalon', 'jean', 'robe', 'jupe', 'veste', 'manteau', 'pull'];
  const colors = ['#ff0000', '#0000ff', '#008000', '#000000', '#ffffff', '#ffc0cb'];
  const colorNames = ['rouge', 'bleu', 'vert', 'noir', 'blanc', 'rose'];
  const patterns = ['uni', 'rayé', 'à carreaux', 'imprimé', 'fleuri'];
  const styles = ['décontracté', 'élégant', 'sportif', 'formel', 'vintage'];
  
  // Sélection aléatoire d'attributs pour la démonstration
  const randomIndex = Math.floor(Math.random() * categories.length);
  const patternIndex = Math.floor(Math.random() * patterns.length);
  const styleIndex = Math.floor(Math.random() * styles.length);
  
  const category = categories[randomIndex];
  const colorIndex = randomIndex % colors.length;
  const color = colors[colorIndex];
  const colorName = colorNames[colorIndex];
  const pattern = patterns[patternIndex];
  const style = styles[styleIndex];
  
  const attributes = { category, colorName, pattern, style, color };
  
  return {
    attributes: {
      color,
      colorName,
      category,
      pattern,
      style
    },
    products: generateFallbackProducts(attributes)
  };
}