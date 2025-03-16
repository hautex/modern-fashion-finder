import axios from 'axios';

export interface VisionApiResponse {
  labelAnnotations: Array<{
    description: string;
    score: number;
    mid: string;
  }>;
  colorInfo: {
    dominantColors: {
      colors: Array<{
        color: {
          red: number;
          green: number;
          blue: number;
        };
        score: number;
        pixelFraction: number;
      }>;
    };
  };
}

/**
 * Analyse une image avec Google Vision API
 * @param imageBase64 Image encodée en base64
 */
export async function analyzeImageWithGoogleVision(imageBase64: string): Promise<VisionApiResponse> {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Vision API Key is missing');
    }

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 15 },
              { type: 'IMAGE_PROPERTIES', maxResults: 5 },
            ],
          },
        ],
      }
    );

    const result = response.data.responses[0];
    
    return {
      labelAnnotations: result.labelAnnotations || [],
      colorInfo: result.imagePropertiesAnnotation || { dominantColors: { colors: [] } }
    };
  } catch (error) {
    console.error('Error analyzing image with Google Vision:', error);
    throw error;
  }
}

/**
 * Extraire les informations sur les vêtements des annotations
 */
export function extractClothingInfo(visionResult: VisionApiResponse) {
  // Liste de catégories de vêtements potentielles
  const clothingCategories = [
    'T-shirt', 't-shirt', 'tee-shirt', 'tee shirt', 'tshirt',
    'chemise', 'shirt', 'top', 'blouse',
    'robe', 'dress',
    'jupe', 'skirt',
    'pantalon', 'pants', 'trousers', 'jeans',
    'veste', 'jacket', 'blazer',
    'manteau', 'coat',
    'pull', 'pullover', 'sweater', 'sweatshirt',
    'hoodie', 'sweat à capuche',
    'short', 'shorts',
    'costume', 'suit'
  ];

  // Liste de styles vestimentaires
  const styleCategories = [
    'casual', 'décontracté',
    'formal', 'formel', 'business',
    'sport', 'sportif', 'athletic',
    'vintage', 'retro',
    'streetwear', 'street',
    'elegant', 'élégant',
    'bohemian', 'bohème',
    'classic', 'classique',
    'modern', 'moderne',
    'minimalist', 'minimaliste'
  ];

  // Liste de motifs
  const patternCategories = [
    'plain', 'uni', 'solid',
    'striped', 'rayé', 'stripes',
    'checked', 'à carreaux', 'checkered',
    'floral', 'fleuri',
    'polka dot', 'pois',
    'printed', 'imprimé',
    'graphic', 'graphique',
    'logo', 'branded',
    'textured', 'texturé',
    'patterned', 'motif'
  ];

  // Rechercher dans les labels pour trouver la catégorie
  const category = visionResult.labelAnnotations
    .find(label => 
      clothingCategories.some(cat => 
        label.description.toLowerCase().includes(cat.toLowerCase())
      )
    )?.description || 'vêtement';

  // Rechercher dans les labels pour trouver le style
  const style = visionResult.labelAnnotations
    .find(label => 
      styleCategories.some(s => 
        label.description.toLowerCase().includes(s.toLowerCase())
      )
    )?.description || 'casual';

  // Rechercher dans les labels pour trouver le motif
  const pattern = visionResult.labelAnnotations
    .find(label => 
      patternCategories.some(p => 
        label.description.toLowerCase().includes(p.toLowerCase())
      )
    )?.description || 'uni';

  // Extraire la couleur dominante
  const dominantColor = visionResult.colorInfo.dominantColors.colors[0]?.color || { red: 0, green: 0, blue: 0 };
  
  // Convertir RGB en HEX
  const color = rgbToHex(dominantColor.red, dominantColor.green, dominantColor.blue);
  
  // Détecter le nom de la couleur
  const colorName = detectColorName(dominantColor);

  // Retourner les informations sur le vêtement
  return {
    category: category.toLowerCase(),
    style: style.toLowerCase(),
    pattern: pattern.toLowerCase(),
    color,
    colorName
  };
}

/**
 * Convertir RGB en HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Détecter le nom de la couleur à partir des valeurs RGB
 */
function detectColorName(color: { red: number, green: number, blue: number }): string {
  const { red, green, blue } = color;
  
  // Couleurs de base
  if (red > 200 && green < 100 && blue < 100) return 'rouge';
  if (red < 100 && green > 200 && blue < 100) return 'vert';
  if (red < 100 && green < 100 && blue > 200) return 'bleu';
  if (red > 200 && green > 200 && blue < 100) return 'jaune';
  if (red > 200 && green < 100 && blue > 200) return 'rose';
  if (red < 100 && green > 150 && blue > 150) return 'turquoise';
  if (red > 200 && green > 100 && blue < 100) return 'orange';
  if (red > 130 && green < 100 && blue > 130) return 'violet';
  if (red > 120 && green > 60 && blue < 50) return 'marron';
  if (red < 50 && green < 50 && blue < 50) return 'noir';
  if (red > 200 && green > 200 && blue > 200) return 'blanc';
  if (red > 100 && green > 100 && blue > 100 && red < 200 && green < 200 && blue < 200) return 'gris';
  
  // Par défaut
  return 'multicolore';
}