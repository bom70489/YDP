import { useState, useEffect, useContext } from 'react';
import { Heart, Share2, MapPin, Bed, Bath, Square } from 'lucide-react';
import Navbar from '../components/navbar';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/UserContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Property {
  _id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
}

interface FavoriteItem {
  propertyId: string;
  addedAt: string;
}

interface FavoritePropertyCardProps {
  property: Property;
  onRemove: (id: string) => void;
}

// Base URL for Python backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FavoritePropertyCard = ({ property, onRemove }: FavoritePropertyCardProps) => (
  <div className="bg-[#F8F5F2] rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
    <div className="flex flex-col md:flex-row">
      {/* Image Section */}
      <div className="md:w-2/5 relative overflow-hidden">
        <img 
          src={property.image || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be'} 
          alt={property.title}
          className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          onClick={() => onRemove(property._id)}
          className="absolute top-4 right-4 bg-white/90 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-full transition"
          aria-label="ลบออกจากรายการโปรด"
        >
          <Heart size={20} className="fill-current" />
        </button>
      </div>

      {/* Content Section */}
      <div className="md:w-3/5 p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-2xl font-bold text-[#6B4E3D] group-hover:text-[#956748] transition">
              {property.title || 'ไม่ระบุชื่อ'}
            </h3>
            <button className="text-[#8B7355] hover:text-[#956748] transition" aria-label="แชร์">
              <Share2 size={20} />
            </button>
          </div>
          
          <div className="flex items-center text-[#8B7355] mb-4">
            <MapPin size={16} className="mr-2" />
            <span>{property.location || 'ไม่ระบุที่อยู่'}</span>
          </div>

          <p className="text-[#8B7355] mb-6 line-clamp-2">
            {property.description || 'ไม่มีรายละเอียด'}
          </p>

          {/* Features */}
          <div className="flex gap-6 mb-6">
            <div className="flex items-center text-[#6B4E3D]">
              <Bed size={20} className="mr-2 text-[#956748]" />
              <span className="font-medium">{property.bedrooms || 0} ห้องนอน</span>
            </div>
            <div className="flex items-center text-[#6B4E3D]">
              <Bath size={20} className="mr-2 text-[#956748]" />
              <span className="font-medium">{property.bathrooms || 0} ห้องน้ำ</span>
            </div>
            <div className="flex items-center text-[#6B4E3D]">
              <Square size={20} className="mr-2 text-[#956748]" />
              <span className="font-medium">{property.area || 0} ตร.ม.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-[#A68A6F]">ราคา</p>
            <p className="text-3xl font-bold text-[#956748]">
              ฿{property.price ? property.price.toLocaleString() : '0'}
            </p>
          </div>
          <Link 
            to={`/property/${property._id}`}
            className="bg-gradient-to-r from-[#956748] to-[#7d5439] text-white px-8 py-3 rounded-full hover:shadow-lg transition font-semibold"
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </div>
  </div>
);

type FilterType = 'all' | 'sell' | 'rent';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterType>('all');
  
  const context = useContext(AuthContext);
  const navigate = useNavigate();

  if (!context) return null;
  const { user, loading: authLoading } = context;

  // Wait for auth loading to complete before checking user
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);

        // 1. Get favorite list from Python backend
        const favResponse = await axios.get(`${API_BASE_URL}/api/favorites/list`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        if (!favResponse.data.success) {
          throw new Error('Failed to fetch favorites');
        }

        const favoriteItems: FavoriteItem[] = favResponse.data.favorites;

        if (favoriteItems.length === 0) {
          setFavorites([]);
          return;
        }

        // 2. Fetch property details for each favorite from Python backend
        const propertyPromises = favoriteItems.map(async (fav) => {
          try {
            const propResponse = await axios.get(`${API_BASE_URL}/property/${fav.propertyId}`);
            return propResponse.data;
          } catch (error) {
            console.error(`Error fetching property ${fav.propertyId}:`, error);
            return null;
          }
        });

        const properties = await Promise.all(propertyPromises);
        const validProperties = properties.filter((p): p is Property => p !== null);
        
        setFavorites(validProperties);

      } catch (error: any) {
        console.error('Error fetching favorites:', error);
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemove = async (propertyId: string) => {
    if (!user?.token) return;

    try {
      // Remove from Python backend
      const response = await axios.post(
        `${API_BASE_URL}/api/favorites/remove`,
        { propertyId },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );

      if (response.data.success) {
        setFavorites(favorites.filter(fav => fav._id !== propertyId));
        toast.success('ลบออกจากรายการโปรดแล้ว');
      }
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const filteredFavorites = filter === 'all' 
    ? favorites 
    : favorites.filter(fav => {
        if (filter === 'sell') return fav.type === 'ขาย';
        if (filter === 'rent') return fav.type === 'เช่า';
        return true;
      });

  if (authLoading || loading) {
    return (
      <div className='bg-gradient-to-br from-[#e7d0c2] via-[#e9cbb8] to-amber-50 min-h-screen flex items-center justify-center'>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mb-4"></div>
          <p className="text-stone-600 text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gradient-to-br from-[#f0eae7] via-white to-[#e9e0da] min-h-screen'>
      <div>
        <Navbar />
      </div>
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#5e4f46] via-[#c28966] to-[#63432f] rounded-full mb-4">
              <Heart size={32} className="text-white fill-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#5e4f46] via-[#976648] to-[#63432f] bg-clip-text text-transparent mb-4">
              รายการโปรด
            </h1>
            <p className="text-xl text-stone-600">
              ทรัพย์สินที่คุณบันทึกไว้ทั้งหมด ({favorites.length} รายการ)
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex justify-center gap-4 mb-12">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full transition ${
                filter === 'all' 
                  ? 'bg-[#9e8270] text-white shadow-lg' 
                  : 'bg-white text-stone-700 hover:bg-amber-50'
              }`}
            >
              ทั้งหมด
            </button>
            <button 
              onClick={() => setFilter('sell')}
              className={`px-6 py-2 rounded-full transition ${
                filter === 'sell' 
                  ? 'bg-[#9e8270] text-white shadow-lg' 
                  : 'bg-white text-stone-700 hover:bg-amber-50'
              }`}
            >
              ขาย
            </button>
            <button 
              onClick={() => setFilter('rent')}
              className={`px-6 py-2 rounded-full transition ${
                filter === 'rent' 
                  ? 'bg-[#9e8270] text-white shadow-lg' 
                  : 'bg-white text-stone-700 hover:bg-amber-50'
              }`}
            >
              เช่า
            </button>
          </div>
        </div>
      </section>

      {/* Favorites List */}
      <section className="pb-16 px-8">
        <div className="max-w-7xl mx-auto">
          {filteredFavorites.length > 0 ? (
            <div className="space-y-6">
              {filteredFavorites.map(property => (
                <FavoritePropertyCard 
                  key={property._id} 
                  property={property} 
                  onRemove={handleRemove}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Heart size={64} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-2xl font-bold text-[#836856] mb-2">
                ยังไม่มีรายการโปรด
              </h3>
              <p className="text-[#836856] mb-6">
                เริ่มค้นหาและบันทึกทรัพย์สินที่คุณสนใจได้เลย
              </p>
              <Link to={"/"} className="inline-block bg-gradient-to-r from-[#836856] to-[#ac856b] text-white px-8 py-3 rounded-full hover:shadow-lg transition">
                เริ่มค้นหา
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FavoritesPage;