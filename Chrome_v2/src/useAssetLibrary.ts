import { useEffect, useState } from 'react';
import { useGameStore } from './useGameStore';
import { AssetManifest } from './lib/AssetManifest';

export function useAssetLibrary(assetId: string, keyword?: string) {
  const { gltf_cache, cacheGltf } = useGameStore();
  const [modelUrl, setModelUrl] = useState<string | null>(gltf_cache[assetId] || AssetManifest[assetId] || null);
  const [loading, setLoading] = useState(!modelUrl);

  useEffect(() => {
    if (modelUrl) return;

    const fetchExternalAsset = async () => {
      setLoading(true);
      try {
        const apiKey = (import.meta as any).env.VITE_ASSET_API_KEY;
        const searchWord = keyword || assetId;

        // If no API key is set, we just fallback immediately
        if (!apiKey) {
          console.warn(`No VITE_ASSET_API_KEY found. Falling back for ${assetId}`);
          setLoading(false);
          return;
        }

        // Simulated API call to an external 3D asset library
        // In a real app, this would use fetch() with the specific API's endpoint
        // e.g. await fetch(\`https://api.sketchfab.com/v3/search?q=\${searchWord}\`)
        
        console.log(`[AssetLibrary] Fetching remote asset for: ${searchWord} using API key...`);
        
        // Simulating network delay and returning a placeholder response
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Here we'd extract the actual .glb/.gltf url from the response.
        // For demonstration, we'll just not find one, triggering the fallback,
        // or you could return a generic valid GLB url here.
        const returnedUrl = null; 

        if (returnedUrl) {
          cacheGltf(assetId, returnedUrl);
          setModelUrl(returnedUrl);
        }
      } catch (err) {
        console.error("Failed to fetch external 3D asset", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExternalAsset();
  }, [assetId, keyword, modelUrl, cacheGltf]);

  return { modelUrl, loading };
}
