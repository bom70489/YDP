import { createContext, useState , type ReactNode } from 'react';
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
}

interface SearchContextType {
  properties: Property[];
  loading: boolean;
  clear: () => void
  search: (query: string) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const clear = () => setProperties([]);

  const search = async (query: string) => {
    setLoading(true);

    try {

      const res = await axios.get("http://localhost:4000/ai/search", {
        params: { q: query }
      });

      const mapped = res.data.map((item: any) => ({
        _id: item._id || item.id?.toString(),
        title: item.name_th,
        location: item.location_village_th || "ไม่มีที่อยู่",
        price: item.asset_details_selling_price,
        bedrooms: item.asset_details_number_of_bedrooms || 0,
        bathrooms: item.asset_details_number_of_bathrooms || 0,
        area: item.asset_details_land_size || 0,
        rating: item.scores || 5,
        description: item.ai_description_th || "-",
        type: item.type || "ขาย",
        image: item.image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be"
      }));

      setProperties(mapped);

      const token = localStorage.getItem("token");

      if (token) {
        await axios.post("http://localhost:4000/api/user/saveSearch",
          { query } , { headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } 

      if(!token) {
        console.log("Sending search to backend:", query);
        await axios.post("http://localhost:4000/api/user/guestSearch", { query })
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <SearchContext.Provider value={{ properties, search , loading , clear }}>
      {children}
    </SearchContext.Provider>
  );
};
