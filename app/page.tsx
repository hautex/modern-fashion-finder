'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Image from 'next/image';
import { AnalysisResponse } from './api/analyze/route';

// Components
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      
      // Create preview
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      
      // Reset states
      setResults(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    onDragEnter: () => setDropActive(true),
    onDragLeave: () => setDropActive(false),
    onDropAccepted: () => setDropActive(false),
    onDropRejected: () => setDropActive(false),
  });

  const searchProducts = async () => {
    if (!file) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append('image', file);

      // Send request to our API route
      const response = await axios.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResults(response.data);

      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (err: any) {
      console.error('Error analyzing image:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
      
      if (err.response) {
        setError(`Erreur: ${err.response.data.error || 'Problème avec le service d\'analyse'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Fashion Finder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trouvez des vêtements similaires à partir d'une simple photo
          </p>
        </header>

        {/* Image Upload Section */}
        <section className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
          <div className="p-6 md:p-8">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${dropActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-4 group">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-80 max-w-full rounded-lg shadow-md transition duration-300 group-hover:shadow-lg" 
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 rounded-lg group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                        Changer d'image
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Cliquez ou glissez-déposez pour changer d'image</p>
                </div>
              ) : (
                <div className="py-10">
                  <CameraIcon />
                  <p className="text-xl font-medium text-gray-800 mb-2">
                    Glissez-déposez une image de vêtement ici
                  </p>
                  <p className="text-sm text-gray-500">
                    ou cliquez pour sélectionner un fichier
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={searchProducts}
              disabled={!file || loading}
              className={`w-full mt-6 flex items-center justify-center font-medium py-3 px-6 rounded-lg transition-all duration-300 text-lg ${!file || loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md hover:shadow-lg'}`}
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Analyse en cours...
                </>
              ) : (
                <>Rechercher des produits similaires</>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        {results && (
          <section id="results" className="mb-12 scroll-mt-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">Caractéristiques détectées</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Catégorie</h3>
                  <p className="text-lg font-semibold capitalize">{results.attributes.category}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Couleur</h3>
                  <div className="flex items-center">
                    <div 
                      className="w-6 h-6 rounded-full mr-2 border border-gray-200" 
                      style={{ backgroundColor: results.attributes.color }}
                    ></div>
                    <p className="text-lg font-semibold capitalize">{results.attributes.color}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Motif</h3>
                  <p className="text-lg font-semibold capitalize">{results.attributes.pattern}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Style</h3>
                  <p className="text-lg font-semibold capitalize">{results.attributes.style}</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">Produits similaires</span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {results.products.length} trouvés
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.products.map((product) => (
                <a 
                  key={product.id} 
                  href={product.productUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group card"
                >
                  <div className="relative h-64 overflow-hidden bg-gray-100">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/300x400?text=Image+Non+Disponible';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs font-bold rounded-full w-10 h-10 flex items-center justify-center">
                      {Math.round(product.similarity * 100)}%
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-primary-600">{product.source}</p>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 h-12 text-sm md:text-base">{product.name}</h3>
                    <p className="font-bold text-lg text-primary-900">
                      {product.price.toFixed(2)} {product.currency}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="inline-flex items-center text-xs font-medium text-primary-600 group-hover:text-primary-800 transition-colors">
                        Voir le produit
                        <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-20">
          <p>© {new Date().getFullYear()} Fashion Finder. Tous droits réservés.</p>
        </footer>
      </div>
    </main>
  );
}