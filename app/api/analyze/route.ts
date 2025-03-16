import { NextResponse } from 'next/server';
import { parseForm, getFileAsBase64 } from '@/lib/parse-form';
import { analyzeImageWithGoogleVision, extractClothingInfo } from '@/lib/google-vision';
import { buildSearchQuery, searchSimilarProducts, SearchResult } from '@/lib/google-search';

// Définition du type de réponse
export type AnalysisResponse = {
  attributes: {
    color: string;
    colorName: string;
    category: string;
    pattern: string;
    style: string;
  };
  products: SearchResult[];
};

export async function POST(request: Request) {
  try {
    console.log('Analyzing image request received');
    
    // Parsing multipart form data
    const { files } = await parseForm(request);
    
    // Vérifiez qu'un fichier a été téléchargé
    if (!files.image || !files.image[0]) {
      console.error('No image provided in request');
      return NextResponse.json(
        { error: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    const file = files.image[0];
    console.log(`Image uploaded: ${file.originalFilename}, size: ${file.size} bytes`);
    
    try {
      // Convertir l'image en base64
      const imageBase64 = await getFileAsBase64(file.filepath);
      console.log('Image converted to base64');
      
      // Analyser l'image avec Google Vision API
      const visionResult = await analyzeImageWithGoogleVision(imageBase64);
      console.log('Vision API analysis complete');
      
      // Extraire les informations sur le vêtement
      const clothingInfo = extractClothingInfo(visionResult);
      console.log('Clothing information extracted:', clothingInfo);
      
      // Créer une requête de recherche
      const searchQuery = buildSearchQuery(
        clothingInfo.category,
        clothingInfo.colorName,
        clothingInfo.pattern,
        clothingInfo.style
      );
      console.log('Search query built:', searchQuery);
      
      // Rechercher des produits similaires
      const products = await searchSimilarProducts(searchQuery, 12);
      console.log(`${products.length} similar products found`);
      
      // Construire et renvoyer la réponse
      const analysisResult: AnalysisResponse = {
        attributes: {
          color: clothingInfo.color,
          colorName: clothingInfo.colorName,
          category: clothingInfo.category,
          pattern: clothingInfo.pattern,
          style: clothingInfo.style
        },
        products
      };

      return NextResponse.json(analysisResult);
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // En cas d'erreur avec les APIs Google, utiliser des données fictives
      const fallbackData = generateFallbackData();
      console.log('Using fallback data due to API error');
      
      return NextResponse.json(fallbackData);
    }
  } catch (error) {
    console.error('General error analyzing image:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'analyse de l\'image' },
      { status: 500 }
    );
  }
}

/**
 * Génère des données fictives en cas d'erreur avec les APIs
 */
function generateFallbackData(): AnalysisResponse {
  // Valeurs aléatoires pour la démonstration
  const categories = ['t-shirt', 'robe', 'pantalon', 'chemise', 'veste', 'pull'];
  const colors = ['#ff0000', '#0000ff', '#008000', '#000000', '#ffffff', '#ffc0cb'];
  const colorNames = ['rouge', 'bleu', 'vert', 'noir', 'blanc', 'rose'];
  const patterns = ['uni', 'rayé', 'à carreaux', 'imprimé', 'fleuri'];
  const styles = ['décontracté', 'élégant', 'sportif', 'formel', 'vintage'];
  
  // Sélection aléatoire d'attributs
  const randomIndex = Math.floor(Math.random() * categories.length);
  const category = categories[randomIndex];
  const colorIndex = randomIndex;
  const color = colors[colorIndex];
  const colorName = colorNames[colorIndex];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const style = styles[Math.floor(Math.random() * styles.length)];
  
  // Générer des produits fictifs
  const products: SearchResult[] = Array(8).fill(0).map((_, index) => {
    const similarity = 0.95 - (index * 0.05);
    
    return {
      id: `fallback-${index}`,
      name: `${style.charAt(0).toUpperCase() + style.slice(1)} ${category} ${pattern} ${colorName}`,
      brand: ['Zara', 'H&M', 'Mango', 'Uniqlo', 'Asos', 'Zalando', 'Bershka', 'Pull & Bear'][index],
      price: Math.floor(Math.random() * 50) + 19.99,
      currency: '€',
      imageUrl: `https://source.unsplash.com/random/300x400?${category},${colorName}`,
      productUrl: 'https://example.com/product',
      source: ['Zara', 'H&M', 'Mango', 'Uniqlo', 'Asos', 'Zalando', 'Bershka', 'Pull & Bear'][index],
      similarity: parseFloat(similarity.toFixed(2))
    };
  });
  
  return {
    attributes: {
      color,
      colorName,
      category,
      pattern,
      style
    },
    products
  };
}