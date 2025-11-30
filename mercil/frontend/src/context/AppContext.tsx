import { createContext, useState, type ReactNode } from 'react';
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
}

const STORAGE_KEY = 'search_properties';

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {

  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
      return [];
    } catch (err) {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  
  const clear = () => {
    setProperties([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const search = async (query: string, filters: SearchFilters = {}) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/ai/search", {
        params: {
          q: query,
          min_price: filters.min_price,
          max_price: filters.max_price,
          min_area: filters.min_area,
          max_area: filters.max_area,
        }
      });
        
      const mapped = res.data.map((item: any) => {
        let coordinates: { lat: number; lng: number } | undefined = undefined;
        
        if (item.coordinates) {
          coordinates = {
            lat: item.coordinates.lat,
            lng: item.coordinates.lng
          };
        } else if (item.location_geo) {
          const geo = item.location_geo;
          
          if (geo.coordinates && Array.isArray(geo.coordinates) && geo.coordinates.length === 2) {
            coordinates = {
              lng: geo.coordinates[0],
              lat: geo.coordinates[1]
            };
          } else if (Array.isArray(geo) && geo.length === 2) {
            coordinates = {
              lng: geo[0],
              lat: geo[1]
            };
          }
        }

        const property: Property = {
          _id: (item._id?._id || item._id?.$oid || item._id || item.id)?.toString(),
          title: item.name_th,
          location: item.location_village_th || "ไม่มีที่อยู่",
          price: Number(item.price).toString(),
          bedrooms: item.asset_details_number_of_bedrooms || 0,
          bathrooms: item.asset_details_number_of_bathrooms || 0,
          area: item.asset_details_land_size || 0,
          rating: item.scores || 5,
          description: item.ai_description_th || "-",
          type: item.type || "ขาย",
          image: item.image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        };

        // เพิ่ม coordinates เฉพาะเมื่อมีค่าที่ถูกต้อง
        if (coordinates && coordinates.lat !== 0 && coordinates.lng !== 0) {
          property.coordinates = coordinates;
        }
        return property;
      });

      setProperties(mapped);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));

      const token = localStorage.getItem("token");

      if (token) {
        await axios.post("http://localhost:4000/api/user/saveSearch",
          { query },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        await axios.post("http://localhost:4000/api/user/guestSearch", { query });
      }

    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('❌ API Error details:', err.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SearchContext.Provider value={{ properties, search, loading, clear }}>
      {children}
    </SearchContext.Provider>
  );
};