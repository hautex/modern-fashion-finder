/**
 * Service d'analyse d'image avec Google Vision API
 */

interface ColorInfo {
  color: {
    red: number;
    green: number;
    blue: number;
  };
  score: number;
  pixelFraction: number;
}

export interface VisionResult {
  colors: string[];
  labels: string[];
  mainColor: string;
  category: string;
  pattern: string;
  style: string;
}

/**
 * Analyser une image avec Google Vision API
 */
export async function analyzeImageWithVision(imageBase64: string): Promise<VisionResult> {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Vision API key is not configured');
    }

    // Préparer la requête pour Google Vision API
    const requestBody = {
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
    };

    // Envoyer la requête à l'API
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Vision API Error:', errorData);
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extraire les labels (étiquettes)
    const labels = data.responses[0]?.labelAnnotations?.map((label: any) => label.description.toLowerCase()) || [];
    
    // Extraire les couleurs dominantes
    const colorInfo: ColorInfo[] = data.responses[0]?.imagePropertiesAnnotation?.dominantColors?.colors || [];
    
    // Convertir les couleurs RGB en hex
    const colors = colorInfo.map((info) => 
      rgbToHex(info.color.red, info.color.green, info.color.blue)
    );
    
    // Analyse du contenu pour déterminer les attributs du vêtement
    const mainColor = colorInfo.length > 0 ? rgbToHex(
      colorInfo[0].color.red, 
      colorInfo[0].color.green, 
      colorInfo[0].color.blue
    ) : '#000000';
    
    // Identifier la catégorie du vêtement
    const clothingTypes = [
      { terms: ['t-shirt', 'tee', 'tee-shirt'], category: 't-shirt' },
      { terms: ['robe', 'dress'], category: 'robe' },
      { terms: ['pantalon', 'jeans', 'pants', 'trousers'], category: 'pantalon' },
      { terms: ['chemise', 'shirt', 'blouse'], category: 'chemise' },
      { terms: ['veste', 'jacket', 'blazer'], category: 'veste' },
      { terms: ['pull', 'sweater', 'pullover', 'sweatshirt', 'hoodie'], category: 'pull' },
      { terms: ['manteau', 'coat'], category: 'manteau' },
      { terms: ['jupe', 'skirt'], category: 'jupe' },
      { terms: ['short', 'shorts'], category: 'short' },
    ];
    
    let category = 'vêtement';
    for (const type of clothingTypes) {
      if (labels.some(label => type.terms.includes(label))) {
        category = type.category;
        break;
      }
    }
    
    // Identifier le motif
    const patterns = [
      { terms: ['stripes', 'striped', 'rayé', 'rayures'], pattern: 'rayé' },
      { terms: ['dots', 'polka dots', 'spotted', 'pois'], pattern: 'à pois' },
      { terms: ['checkered', 'checked', 'plaid', 'tartan', 'carreaux'], pattern: 'à carreaux' },
      { terms: ['floral', 'flower', 'flowers', 'fleuri'], pattern: 'fleuri' },
      { terms: ['print', 'printed', 'imprimé', 'pattern', 'motif'], pattern: 'imprimé' },
    ];
    
    let pattern = 'uni';
    for (const p of patterns) {
      if (labels.some(label => p.terms.some(term => label.includes(term)))) {
        pattern = p.pattern;
        break;
      }
    }
    
    // Identifier le style
    const styles = [
      { terms: ['casual', 'décontracté', 'casual wear'], style: 'décontracté' },
      { terms: ['formal', 'business', 'elegant', 'formel', 'élégant', 'chic'], style: 'élégant' },
      { terms: ['sport', 'athletic', 'sportif', 'sportswear'], style: 'sportif' },
      { terms: ['vintage', 'retro', 'rétro'], style: 'vintage' },
      { terms: ['bohemian', 'boho', 'bohème'], style: 'bohème' },
    ];
    
    let style = 'décontracté';
    for (const s of styles) {
      if (labels.some(label => s.terms.some(term => label.includes(term)))) {
        style = s.style;
        break;
      }
    }
    
    return {
      colors,
      labels,
      mainColor,
      category,
      pattern,
      style
    };
  } catch (error) {
    console.error('Error analyzing image with Google Vision:', error);
    throw error;
  }
}

/**
 * Convertir RGB en code hexadécimal de couleur
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Obtenir le nom d'une couleur à partir de son code hexadécimal
 */
export function getColorName(hex: string): string {
  // Liste de couleurs de base avec leurs codes hex approximatifs
  const colors = [
    { name: 'rouge', hex: '#FF0000' },
    { name: 'vert', hex: '#00FF00' },
    { name: 'bleu', hex: '#0000FF' },
    { name: 'jaune', hex: '#FFFF00' },
    { name: 'orange', hex: '#FFA500' },
    { name: 'violet', hex: '#800080' },
    { name: 'rose', hex: '#FFC0CB' },
    { name: 'marron', hex: '#A52A2A' },
    { name: 'gris', hex: '#808080' },
    { name: 'noir', hex: '#000000' },
    { name: 'blanc', hex: '#FFFFFF' }
  ];

  // Convertir le hex en RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Trouver la couleur la plus proche
  let closestColor = colors[0];
  let closestDistance = 1000000;

  for (const color of colors) {
    const cr = parseInt(color.hex.slice(1, 3), 16);
    const cg = parseInt(color.hex.slice(3, 5), 16);
    const cb = parseInt(color.hex.slice(5, 7), 16);

    // Calculer la distance euclidienne dans l'espace RGB
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = color;
    }
  }

  return closestColor.name;
}