import { useContext, useState, useEffect } from 'react';
import { MapPin, Bed, Bath, Maximize, Heart, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { SearchContext } from '../context/AppContext';
import { AuthContext } from '../context/UserContext';
import axios from 'axios';
import { toast } from 'react-toastify';

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

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const location = useLocation();
  const authContext = useContext(AuthContext);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!authContext) return null;
  const { user } = authContext;

  // เช็คว่าทรัพย์สินนี้อยู่ใน favorites หรือไม่
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.token || !property._id) {
        setIsFavorite(false); 
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:4000/api/user/favorite/check/${property._id}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        if (response.data.success) {
          setIsFavorite(response.data.isFavorite);
        }
      } catch (error) {
        console.error('Error checking favorite:', error);
        setIsFavorite(false); 
      }
    };

    checkFavorite();
  }, [user, property._id]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!property._id) return;

    try {
      setIsLoading(true);

      if (isFavorite) {
        const response = await axios.delete(
          'http://localhost:4000/api/user/favorite/remove',
          {
            data: { propertyId: property._id },
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );

        if (response.data.success) {
          setIsFavorite(false);
          toast.success('ลบออกจากรายการโปรดแล้ว');
        }
      } else {
        const response = await axios.post(
          'http://localhost:4000/api/user/favorite/add',
          { propertyId: property._id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        if (response.data.success) {
          setIsFavorite(true);
          toast.success('เพิ่มเข้ารายการโปรดแล้ว');
        }
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  if (!property) return null;

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 hover:cursor-pointer">
      
      <div className="relative h-56 overflow-hidden">
        <img 
          src={property.image} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        <button 
          onClick={handleToggleFavorite}
          disabled={isLoading}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 shadow-lg group/heart ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            isFavorite 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-white/90 hover:bg-white'
          }`}
        >
          <Heart 
            className={`w-4 h-4 transition-all duration-200 ${
              isFavorite 
                ? 'text-white fill-white' 
                : 'text-gray-600 group-hover/heart:text-[#b76e79] group-hover/heart:fill-[#b76e79]'
            }`}
          />
        </button>

        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
            <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
            <span className="text-xs font-semibold text-gray-800">{property.rating}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#7b5e57] transition-colors duration-200 line-clamp-1">
          {property.title}
        </h3>
        
        <div className="flex items-center gap-1 text-gray-600 mb-4">
          <MapPin className="w-4 h-4 text-[#a2836e] flex-shrink-0" />
          <span className="text-sm line-clamp-1">{property.location}</span>
        </div>

        <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4 text-[#8d6e63]" />
            <span className="text-sm text-gray-700">{property.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4 text-[#a1887f]" />
            <span className="text-sm text-gray-700">{property.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4 text-[#795548]" />
            <span className="text-sm text-gray-700">{Number(property.area)?.toLocaleString()} ตร.ม.</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">ราคา</p>
            <p className="text-xl font-bold bg-gradient-to-r from-[#7b5e57] to-[#a2836e] bg-clip-text text-transparent">
              ฿{Number(property.price)?.toLocaleString()}
            </p>
          </div>

          <Link 
            to={`/property/${property._id}`}
            state={{ from: location.pathname }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r 
              from-[#6f4e37] to-[#a47551]
              hover:from-[#5d3f2c] hover:to-[#8d623f]
              text-white text-sm font-semibold transition-all duration-200 
              shadow-lg hover:shadow-xl"
          >
            ดูเพิ่ม
          </Link>
        </div>
      </div>
    </div>
  );
};

const PropertyCardList = () => {
  const context = useContext(SearchContext);

  if (!context) {
    console.error('❌ SearchContext is null!');
    return null;
  }
  
  const { properties, loading } = context;

  console.log('🔍 PropertyCardList render');
  console.log('📦 Properties:', properties.length);
  console.log('⏳ Loading:', loading);
  console.log('📄 First property:', properties[0]); // ← เพิ่มบรรทัดนี้

  if (loading) {
    console.log('⏳ Showing loading spinner');
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-[#7b5e57] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    console.log('❌ Showing empty state');
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 text-lg mb-2">ไม่พบข้อมูลทรัพย์สิน</p>
        <p className="text-gray-400 text-sm">ลองค้นหาด้วยคำอื่น หรือปรับตัวกรอง</p>
      </div>
    );
  }

  console.log('✅ Rendering properties grid');

  return (
    <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property._id} property={property} />
      ))}
    </div>
  );
};

export default PropertyCardList;