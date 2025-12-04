import { createContext, useState, useEffect, useRef, type ReactNode } from 'react';
import axios from 'axios';

interface Property {
  _id?: string;
  title: string;
  location: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  rating: number;
  type: string;
  description?: string;
  image?: string;
  coordinates?: { lat: number; lng: number };
}

interface SearchFilters {
  min_price?: number | null;
  max_price?: number | null;
  min_area?: number | null;
  max_area?: number | null;
}

interface SearchContextType {
  properties: Property[];
  loading: boolean;
  clear: () => void;
  search: (query: string, filters?: SearchFilters) => void;
  loadRecommendations: () => Promise<void>;
}

const STORAGE_KEY = 'search_properties';
const SEARCH_HISTORY_KEY = 'search_history';

// Base URL for Python backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const hasInitialized = useRef(false);
  
  const clear = () => {
    setProperties([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const loadRecommendations = async () => {
    console.log('🎯 loadRecommendations called');
    setLoading(true);
    
    try {
      const searchHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
      let favorites: string[] = [];

      const token = localStorage.getItem("token");
      
      // Get favorites from Python backend
      if (token) {
        try {
          const favRes = await axios.get(`${API_BASE_URL}/api/favorites/list`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (favRes.data.success && favRes.data.favorites) {
            favorites = favRes.data.favorites.map((item: any) => {
              if (typeof item === 'string') {
                return item;
              } else if (item.propertyId) {
                return item.propertyId;
              }
              return null;
            }).filter(Boolean);
          }
        } catch (err) {
          console.error('⚠️ Failed to fetch favorites:', err);
        }
      }

      const payload = {
        searchHistory: searchHistory,
        favorites: favorites.map((id: string) => ({ propertyId: id }))
      };

      // Get recommendations from Python backend
      const res = await axios.post(`${API_BASE_URL}/recommendations`, payload);
      
      const resultsArray = res.data.results || [];

      if (resultsArray.length === 0) {
        setProperties([]);
        return;
      }

      // Map results to Property type
      const mapped = resultsArray.map((item: any) => {
        let coordinates: { lat: number; lng: number } | undefined = undefined;
        
        if (item.coordinates && item.coordinates.lat && item.coordinates.lng) {
          coordinates = {
            lat: item.coordinates.lat,
            lng: item.coordinates.lng
          };
        }

        const property: Property = {
          _id: item._id,
          title: item.title || "ไม่มีชื่อ",
          location: item.location || "ไม่มีที่อยู่",
          price: Number(item.price || 0).toString(),
          bedrooms: Number(item.bedrooms) || 0,
          bathrooms: Number(item.bathrooms) || 0,
          area: Number(item.area) || 0,
          rating: item.rating || 5,
          description: item.description || "-",
          type: item.type || "ขาย",
          image: item.image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170",
        };

        if (coordinates && coordinates.lat !== 0 && coordinates.lng !== 0) {
          property.coordinates = coordinates;
        }
        
        return property;
      });

      setProperties(mapped);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));

    } catch (err) {
      console.error('❌ Error loading recommendations:', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {   
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadRecommendations();
    }
  }, []); 

  const search = async (query: string, filters: SearchFilters = {}) => {
    setLoading(true);
    
    try {
      // Search from Python backend
      const res = await axios.get(`${API_BASE_URL}/hybrid_search`, {
        params: {
          query: query,  
          top_k: 10,
          min_price: filters.min_price,
          max_price: filters.max_price,
          min_area: filters.min_area,
          max_area: filters.max_area,
        }
      });
        
      const resultsArray = res.data.results || [];
      
      // Map results to Property type
      const mapped = resultsArray.map((item: any) => {
        let coordinates: { lat: number; lng: number } | undefined = undefined;
        
        if (item.coordinates && item.coordinates.lat && item.coordinates.lng) {
          coordinates = {
            lat: item.coordinates.lat,
            lng: item.coordinates.lng
          };
        }

        const property: Property = {
          _id: item._id,
          title: item.title || "ไม่มีชื่อ",
          location: item.location || "ไม่มีที่อยู่",
          price: Number(item.price || 0).toString(),
          bedrooms: Number(item.bedrooms) || 0,
          bathrooms: Number(item.bathrooms) || 0,
          area: Number(item.area) || 0,
          rating: 5,
          description: item.description || "-",
          type: item.type || "ขาย",
          image: item.image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        };

        if (coordinates && coordinates.lat !== 0 && coordinates.lng !== 0) {
          property.coordinates = coordinates;
        }
        
        return property;
      });

      setProperties(mapped);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));

      // Update local search history
      const currentHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
      const updatedHistory = [query, ...currentHistory.filter((q: string) => q !== query)].slice(0, 20);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));

      // Save search to Python backend
      const token = localStorage.getItem("token");

      if (token) {
        // Save authenticated user search
        await axios.post(
          `${API_BASE_URL}/api/search/save`,
          { query },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        // Save guest search
        await axios.post(`${API_BASE_URL}/api/search/guest`, { query });
      }

    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('❌ API Error:', err.response?.data);
        console.error('❌ Request params:', err.config?.params);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SearchContext.Provider value={{ 
      properties, 
      search, 
      loading, 
      clear, 
      loadRecommendations 
    }}>
      {children}
    </SearchContext.Provider>
  );
};