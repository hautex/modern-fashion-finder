import axios from 'axios';

// Définition du type pour un produit
export interface Product {
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
 * Recherche des produits similaires en utilisant Google Custom Search API
 * @param query - Termes de recherche
 * @returns Liste de produits
 */
export const searchSimilarProducts = async (
  query: string,
  options: { 
    limit?: number; 
    exactTerms?: string;
    excludeTerms?: string;
  } = {}
): Promise<Product[]> => {
  try {
    // Récupérer les clés API depuis les variables d'environnement
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      throw new Error('Google API keys not defined');
    }

    // Définir le nombre de résultats à récupérer (max 10 par requête)
    const limit = options.limit || 8;
    
    // Construire la requête pour Google Custom Search
    let url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${limit}`;
    
    // Ajouter des termes de recherche exacts si spécifiés
    if (options.exactTerms) {
      url += `&exactTerms=${encodeURIComponent(options.exactTerms)}`;
    }
    
    // Ajouter des termes à exclure si spécifiés
    if (options.excludeTerms) {
      url += `&excludeTerms=${encodeURIComponent(options.excludeTerms)}`;
    }
    
    // Spécifier que nous voulons des résultats de Shopping
    url += '&siteSearch=google.com/shopping&siteSearchFilter=i';

    // Envoyer la requête à Google Custom Search
    const response = await axios.get(url);
    
    // Vérifier si des résultats ont été trouvés
    if (!response.data.items || response.data.items.length === 0) {
      console.log('Aucun résultat trouvé pour la requête:', query);
      return [];
    }

    // Transformer les résultats en liste de produits
    return response.data.items.map((item: any, index: number) => {
      // Extraire le prix s'il est présent (format potentiel: "€39,99", "$49.99", etc.)
      let price = 0;
      let currency = '€';
      
      const priceMatch = item.title.match(/[€$£¥](\d+[,.]\d+|\d+)/) || 
                         item.snippet?.match(/[€$£¥](\d+[,.]\d+|\d+)/);
      
      if (priceMatch) {
        const currencySymbol = priceMatch[0][0];
        const currencyMap: Record<string, string> = { '€': '€', '$': '$', '£': '£', '¥': '¥' };
        currency = currencyMap[currencySymbol] || '€';
        
        // Extraire la valeur numérique et remplacer les virgules par des points
        const priceValue = priceMatch[1].replace(',', '.');
        price = parseFloat(priceValue);
      } else {
        // Prix par défaut si non trouvé
        price = 20 + Math.floor(Math.random() * 80);
      }
      
      // Extraire le nom de la marque (généralement avant le premier tiret ou parenthèse)
      let brand = 'Marque';
      let name = item.title;
      
      const brandSeparators = [' - ', ' | ', ' : ', ' – ', ' — '];
      for (const separator of brandSeparators) {
        if (item.title.includes(separator)) {
          const parts = item.title.split(separator);
          brand = parts[0].trim();
          name = parts.slice(1).join(separator).trim();
          break;
        }
      }
      
      // Si aucun séparateur n'est trouvé, utiliser le premier mot comme marque
      if (brand === 'Marque') {
        const words = item.title.split(' ');
        if (words.length > 1) {
          brand = words[0];
          name = words.slice(1).join(' ');
        }
      }

      // Extraire l'URL de l'image si disponible
      let imageUrl = item.pagemap?.cse_image?.[0]?.src || 
                    item.pagemap?.cse_thumbnail?.[0]?.src;
      
      // Fallback si aucune image n'est trouvée
      if (!imageUrl) {
        imageUrl = 'https://via.placeholder.com/300x400?text=Image+Non+Disponible';
      }
      
      // Extraire la source (nom du site)
      const source = new URL(item.link).hostname.replace('www.', '').split('.')[0];
      
      // Calculer un score de similarité (décroissant avec l'index)
      const similarity = Math.max(0.2, 1 - (index * 0.1));
      
      return {
        id: `google-${index}-${Date.now()}`,
        name,
        brand,
        price,
        currency,
        imageUrl,
        productUrl: item.link,
        source: source.charAt(0).toUpperCase() + source.slice(1),
        similarity
      };
    });
  } catch (error) {
    console.error('Error searching for similar products:', error);
    throw error;
  }
};

/**
 * Construit une requête de recherche basée sur les attributs détectés
 * @param attributes Caractéristiques du vêtement détecté
 * @returns Chaîne de recherche optimisée
 */
export const buildSearchQuery = (attributes: {
  category: string;
  colorName: string;
  pattern: string;
  style: string;
}): string => {
  // Construire une requête de base
  let query = `${attributes.colorName} ${attributes.category}`;
  
  // Ajouter le motif s'il n'est pas "uni"
  if (attributes.pattern !== 'uni') {
    query += ` ${attributes.pattern}`;
  }
  
  // Ajouter le style s'il est significatif
  if (attributes.style && attributes.style !== 'casual' && attributes.style !== 'décontracté') {
    query += ` ${attributes.style}`;
  }
  
  // Ajouter des termes pour améliorer les résultats
  query += ' acheter vêtement mode';
  
  return query;
};