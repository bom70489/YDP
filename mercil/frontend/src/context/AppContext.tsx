import { createContext, useState, useEffect, type ReactNode } from 'react';
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
  console.log('🏗️ SearchProvider mounting...');

  // ✅ โหลดข้อมูลจาก sessionStorage ตอน init
  const [properties, setProperties] = useState<Property[]>(() => {
    console.log('🔄 Initializing properties state...');
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      console.log('📦 sessionStorage raw:', saved);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ Restored', parsed.length, 'properties from sessionStorage');
        console.log('📊 First property:', parsed[0]);
        return parsed;
      } else {
        console.log('⚠️ No data in sessionStorage');
      }
      return [];
    } catch (err) {
      console.error('❌ Error restoring from sessionStorage:', err);
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  // ✅ Log เมื่อ properties เปลี่ยน
  useEffect(() => {
    console.log('🔔 Properties changed! Count:', properties.length);
    console.log('📋 Properties data:', properties);
  }, [properties]);

  // ✅ บันทึกข้อมูลลง sessionStorage ทุกครั้งที่ properties เปลี่ยน
  useEffect(() => {
    console.log('💾 Save effect triggered, properties count:', properties.length);
    
    if (properties.length > 0) {
      try {
        const jsonData = JSON.stringify(properties);
        console.log('📝 Saving to sessionStorage...');
        console.log('📝 Data length:', jsonData.length, 'characters');
        
        sessionStorage.setItem(STORAGE_KEY, jsonData);
        
        // ตรวจสอบว่าบันทึกสำเร็จ
        const verification = sessionStorage.getItem(STORAGE_KEY);
        if (verification) {
          const verifiedData = JSON.parse(verification);
          console.log('✅ Save verified! Stored', verifiedData.length, 'properties');
          console.log('✅ First stored property:', verifiedData[0]);
        } else {
          console.error('❌ Save verification failed - got null');
        }
      } catch (err) {
        console.error('❌ Error saving to sessionStorage:', err);
      }
    } else {
      console.log('⚠️ Properties empty, skipping save');
    }
  }, [properties]);

  const clear = () => {
    console.log('🗑️ Clearing properties...');
    setProperties([]);
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('✅ Properties cleared');
  };

  const search = async (query: string, filters: SearchFilters = {}) => {
    console.log('🔎 Search started with query:', query);
    console.log('🔎 Filters:', filters);
    
    setLoading(true);

    try {
      console.log('📡 Calling API...');
      const res = await axios.get("http://localhost:4000/ai/search", {
        params: {
          q: query,
          min_price: filters.min_price,
          max_price: filters.max_price,
          min_area: filters.min_area,
          max_area: filters.max_area,
        }
      });

      console.log('📥 API Response received');
      console.log('📥 Response data length:', res.data.length);
      console.log('📥 First item:', res.data[0]);

      const mapped = res.data.map((item: any) => ({
        _id: (item._id?._id || item._id?.$oid || item._id || item.id)?.toString(),
        title: item.name_th,
        location: item.location_village_th || "ไม่มีที่อยู่",
        price: Number(item.price),
        bedrooms: item.asset_details_number_of_bedrooms || 0,
        bathrooms: item.asset_details_number_of_bathrooms || 0,
        area: item.asset_details_land_size || 0,
        rating: item.scores || 5,
        description: item.ai_description_th || "-",
        type: item.type || "ขาย",
        image: item.image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be"
      }));

      console.log('📊 Mapped data ready:', mapped.length, 'properties');
      console.log('📊 First mapped property:', mapped[0]);
      console.log('🎯 About to call setProperties...');
      
      setProperties(mapped);
      
      console.log('✅ setProperties called successfully');

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
        console.log('✅ Saved search to user history');
      } else {
        await axios.post("http://localhost:4000/api/user/guestSearch", { query });
        console.log('✅ Saved search to guest history');
      }

    } catch (err) {
      console.error('❌ Search error:', err);
      if (axios.isAxiosError(err)) {
        console.error('❌ API Error details:', err.response?.data);
      }
    } finally {
      setLoading(false);
      console.log('🏁 Search completed');
    }
  };

  return (
    <SearchContext.Provider value={{ properties, search, loading, clear }}>
      {children}
    </SearchContext.Provider>
  );
};