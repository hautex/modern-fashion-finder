import axios from 'axios';

export interface SearchResult {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  source: string;
  similarity: number;
}

/**
 * Recherche des produits similaires avec l'API Google Custom Search
 */
export async function searchSimilarProducts(
  query: string,
  count: number = 10
): Promise<SearchResult[]> {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      throw new Error('Google API key or search engine ID is missing');
    }

    console.log(`Searching for: ${query}`);
    
    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: query,
          num: count,
          searchType: 'image',
          imgType: 'shopping',
          filter: '1', // filter duplicate content
        },
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      console.log('No search results found');
      return [];
    }

    const results: SearchResult[] = [];

    // Traiter chaque résultat de recherche
    for (let i = 0; i < response.data.items.length; i++) {
      const item = response.data.items[i];
      
      // Extraire le prix (si disponible)
      let price = 0;
      let currency = '€';
      
      // Chercher un prix dans le titre ou la description
      const priceMatch = item.title.match(/(\d+[,.]\d+)(\s*[€$£])/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', '.'));
        currency = priceMatch[2].trim();
      } else {
        // Prix par défaut si non trouvé
        price = 29.99 + Math.random() * 50;
      }
      
      // Essayer d'extraire la marque
      let brand = '';
      const brandMatch = item.displayLink.match(/^(?:www\.)?([^.]+)\./);
      if (brandMatch) {
        brand = brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1);
      } else {
        brand = item.displayLink.split('.')[0];
      }
      
      // Nettoyer le titre
      let name = item.title.split('-')[0].trim();
      if (name.length > 50) {
        name = name.substring(0, 50) + '...';
      }
      
      // Calculer un score de similarité (ici, simulé)
      const similarity = Math.max(0.3, 1 - (i * 0.08));
      
      results.push({
        id: `search-${i}-${Date.now()}`,
        name,
        brand: brand || 'Marque inconnue',
        price: Number(price.toFixed(2)),
        currency,
        imageUrl: item.link,
        productUrl: item.image?.contextLink || item.link,
        source: item.displayLink || 'Google Shopping',
        similarity,
      });
    }

    return results;
  } catch (error) {
    console.error('Error searching similar products:', error);
    throw error;
  }
}

/**
 * Construit une requête de recherche à partir des caractéristiques détectées
 */
export function buildSearchQuery(
  category: string,
  colorName: string,
  pattern: string = 'uni',
  style: string = 'casual'
): string {
  // Normaliser et traduire si nécessaire
  const normalizedCategory = normalizeCategory(category);
  
  // Construire la requête de base
  let query = `${colorName} ${normalizedCategory}`;
  
  // Ajouter le motif s'il n'est pas "uni" ou "plain"
  if (pattern && !['uni', 'plain', 'solid'].includes(pattern.toLowerCase())) {
    query += ` ${pattern}`;
  }
  
  // Ajouter le style s'il n'est pas "casual" ou "décontracté"
  if (style && !['casual', 'décontracté'].includes(style.toLowerCase())) {
    query += ` ${style}`;
  }
  
  // Ajouter des mots-clés pour la recherche de vêtements
  query += ' acheter vêtement';
  
  return query;
}

/**
 * Normalise la catégorie de vêtement
 */
function normalizeCategory(category: string): string {
  const lowerCategory = category.toLowerCase();
  
  // Mappage des catégories en anglais vers français
  const categoryMap: Record<string, string> = {
    'shirt': 'chemise',
    'tshirt': 't-shirt',
    't shirt': 't-shirt',
    'tee': 't-shirt',
    'tee-shirt': 't-shirt',
    'dress': 'robe',
    'trouser': 'pantalon',
    'pant': 'pantalon',
    'pants': 'pantalon',
    'jeans': 'jean',
    'skirt': 'jupe',
    'jacket': 'veste',
    'coat': 'manteau',
    'sweater': 'pull',
    'sweatshirt': 'sweat',
    'hoodie': 'sweat à capuche',
    'suit': 'costume',
    'short': 'short',
  };
  
  // Vérifier si la catégorie est dans notre mappage
  for (const [eng, fr] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(eng)) {
      return fr;
    }
  }
  
  // Si pas de correspondance, retourner la catégorie originale
  return category;
}