import axios from 'axios';

// Type pour les résultats de l'analyse Google Vision
export interface VisionAnalysisResult {
  colors: {
    color: string;
    name: string;
    score: number;
    pixelFraction: number;
  }[];
  labels: {
    description: string;
    score: number;
  }[];
  webEntities: {
    description: string;
    score: number;
  }[];
}

/**
 * Analyse une image avec Google Vision API
 * @param imageBase64 - Image encodée en base64
 * @returns Résultats de l'analyse
 */
export const analyzeImageWithVision = async (imageBase64: string): Promise<VisionAnalysisResult> => {
  try {
    // Récupérer la clé API depuis les variables d'environnement
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Vision API key is not defined');
    }

    // Construire la requête pour Google Vision API
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const data = {
      requests: [
        {
          image: {
            content: imageBase64,
          },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 15 },
            { type: 'IMAGE_PROPERTIES', maxResults: 10 },
            { type: 'WEB_DETECTION', maxResults: 10 },
          ],
        },
      ],
    };

    // Envoyer la requête à Google Vision API
    const response = await axios.post(url, data);
    
    // Extraire les résultats pertinents de la réponse
    const result = response.data.responses[0];
    
    // Extraire les couleurs dominantes
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors.map((color: any) => {
      const r = color.color.red || 0;
      const g = color.color.green || 0;
      const b = color.color.blue || 0;
      
      // Convertir RGB en hexadécimal
      const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      
      // Obtenir un nom approximatif de la couleur
      const colorName = getColorName(r, g, b);
      
      return {
        color: hexColor,
        name: colorName,
        score: color.score,
        pixelFraction: color.pixelFraction
      };
    }) || [];

    // Extraire les labels (étiquettes) de l'image
    const labels = result.labelAnnotations?.map((label: any) => ({
      description: label.description,
      score: label.score
    })) || [];

    // Extraire les entités web (pour trouver des informations sur les vêtements)
    const webEntities = result.webDetection?.webEntities?.map((entity: any) => ({
      description: entity.description,
      score: entity.score
    })) || [];

    return {
      colors,
      labels,
      webEntities
    };
  } catch (error) {
    console.error('Error analyzing image with Google Vision:', error);
    throw error;
  }
};

/**
 * Attribution d'un nom approximatif à une couleur RGB
 */
function getColorName(r: number, g: number, b: number): string {
  // Couleurs de base avec leurs plages RGB
  const colors = [
    { name: 'noir', condition: () => r < 30 && g < 30 && b < 30 },
    { name: 'blanc', condition: () => r > 220 && g > 220 && b > 220 },
    { name: 'gris', condition: () => Math.abs(r - g) < 20 && Math.abs(r - b) < 20 && Math.abs(g - b) < 20 && r > 30 && r < 220 },
    { name: 'rouge', condition: () => r > 170 && g < 120 && b < 120 },
    { name: 'rose', condition: () => r > 180 && g > 80 && g < 180 && b > 140 && b < 200 },
    { name: 'orange', condition: () => r > 180 && g > 80 && g < 180 && b < 100 },
    { name: 'jaune', condition: () => r > 180 && g > 180 && b < 100 },
    { name: 'vert', condition: () => r < 120 && g > 120 && b < 120 },
    { name: 'bleu', condition: () => r < 120 && g < 120 && b > 120 },
    { name: 'violet', condition: () => r > 100 && r < 200 && g < 100 && b > 120 },
    { name: 'marron', condition: () => r > 100 && r < 200 && g > 50 && g < 140 && b < 100 },
  ];

  // Trouver la couleur correspondante
  const color = colors.find(color => color.condition());
  return color ? color.name : 'inconnu';
}

/**
 * Extraire les caractéristiques de vêtement des résultats de Vision API
 */
export const extractClothingAttributes = (result: VisionAnalysisResult) => {
  // Extraire les labels liés aux vêtements
  const clothingLabels = result.labels.filter(label => 
    isClothingRelated(label.description)
  );

  // Catégories de vêtements courantes (en français et en anglais pour la reconnaissance)
  const categories = [
    { keywords: ['t-shirt', 'tee-shirt', 'tee shirt', 't shirt'], value: 't-shirt' },
    { keywords: ['shirt', 'chemise'], value: 'chemise' },
    { keywords: ['pants', 'pantalon', 'trousers'], value: 'pantalon' },
    { keywords: ['jeans', 'jean'], value: 'jean' },
    { keywords: ['dress', 'robe'], value: 'robe' },
    { keywords: ['skirt', 'jupe'], value: 'jupe' },
    { keywords: ['jacket', 'veste', 'blouson'], value: 'veste' },
    { keywords: ['coat', 'manteau'], value: 'manteau' },
    { keywords: ['sweater', 'pull', 'pullover', 'pull-over'], value: 'pull' },
    { keywords: ['hoodie', 'sweatshirt', 'sweat', 'sweat-shirt'], value: 'sweat' },
    { keywords: ['shorts', 'short'], value: 'short' },
    { keywords: ['suit', 'costume'], value: 'costume' },
    { keywords: ['blouse'], value: 'blouse' },
    { keywords: ['cardigan'], value: 'cardigan' },
    { keywords: ['blazer'], value: 'blazer' },
    { keywords: ['top'], value: 'top' },
  ];

  // Motifs
  const patterns = [
    { keywords: ['striped', 'stripes', 'rayé', 'rayures', 'à rayures'], value: 'rayé' },
    { keywords: ['checked', 'checkered', 'à carreaux', 'carreaux'], value: 'à carreaux' },
    { keywords: ['polka dot', 'dotted', 'à pois', 'pois'], value: 'à pois' },
    { keywords: ['floral', 'flowery', 'fleuri'], value: 'fleuri' },
    { keywords: ['plain', 'solid', 'uni'], value: 'uni' },
    { keywords: ['printed', 'imprimé', 'print'], value: 'imprimé' },
  ];

  // Styles
  const styles = [
    { keywords: ['casual', 'décontracté'], value: 'décontracté' },
    { keywords: ['formal', 'formel'], value: 'formel' },
    { keywords: ['elegant', 'élégant'], value: 'élégant' },
    { keywords: ['sport', 'sportif', 'athletic', 'sportswear'], value: 'sportif' },
    { keywords: ['vintage', 'retro', 'rétro'], value: 'vintage' },
    { keywords: ['business', 'work', 'professionnel'], value: 'business' },
    { keywords: ['boho', 'bohème', 'bohemian'], value: 'bohème' },
    { keywords: ['classic', 'classique'], value: 'classique' },
  ];

  // Trouver la catégorie
  let category = 'vêtement';
  for (const label of [...clothingLabels, ...result.webEntities]) {
    for (const cat of categories) {
      if (cat.keywords.some(keyword => 
        label.description.toLowerCase().includes(keyword.toLowerCase())
      )) {
        category = cat.value;
        break;
      }
    }
    if (category !== 'vêtement') break;
  }

  // Trouver le motif
  let pattern = 'uni'; // Motif par défaut
  for (const label of [...clothingLabels, ...result.webEntities]) {
    for (const pat of patterns) {
      if (pat.keywords.some(keyword => 
        label.description.toLowerCase().includes(keyword.toLowerCase())
      )) {
        pattern = pat.value;
        break;
      }
    }
    if (pattern !== 'uni') break;
  }

  // Trouver le style
  let style = 'casual'; // Style par défaut
  for (const label of [...clothingLabels, ...result.webEntities]) {
    for (const sty of styles) {
      if (sty.keywords.some(keyword => 
        label.description.toLowerCase().includes(keyword.toLowerCase())
      )) {
        style = sty.value;
        break;
      }
    }
    if (style !== 'casual') break;
  }

  // Obtenir la couleur dominante
  const dominantColor = result.colors.length > 0 ? result.colors[0] : { name: 'inconnu', color: '#000000' };

  return {
    category,
    color: dominantColor.color,
    colorName: dominantColor.name,
    pattern,
    style
  };
};

/**
 * Vérifier si un label est en rapport avec un vêtement
 */
function isClothingRelated(label: string): boolean {
  const clothingTerms = [
    'shirt', 't-shirt', 'tee', 'dress', 'pants', 'jeans', 'jacket', 'coat', 'sweater', 
    'hoodie', 'shorts', 'skirt', 'suit', 'blouse', 'top', 'cardigan', 'blazer',
    'chemise', 'robe', 'pantalon', 'jean', 'veste', 'manteau', 'pull', 'sweat', 
    'short', 'jupe', 'costume', 'clothing', 'garment', 'apparel', 'fashion', 'wear',
    'vêtement', 'habit', 'tenue', 'mode'
  ];
  
  return clothingTerms.some(term => 
    label.toLowerCase().includes(term.toLowerCase())
  );
}
