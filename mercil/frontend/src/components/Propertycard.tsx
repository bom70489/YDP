import { useContext } from 'react';
import { MapPin, Bed, Bath, Maximize, Heart, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; // ✅ เพิ่ม useLocation
import { SearchContext } from '../context/AppContext';

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
  const location = useLocation(); // ✅ เพิ่มนี้

  if (!property) return null;

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 hover:cursor-pointer">
      
      {/* รูปภาพ */}
      <div className="relative h-56 overflow-hidden">
        <img 
          src={property.image} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* ปุ่มหัวใจ */}
        <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all duration-200 shadow-lg group/heart">
          <Heart className="w-4 h-4 text-gray-600 group-hover/heart:text-[#b76e79] group-hover/heart:fill-[#b76e79] transition-all duration-200" />
        </button>

        {/* Rating */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
            <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
            <span className="text-xs font-semibold text-gray-800">{property.rating}</span>
          </div>
        </div>
      </div>

      {/* ข้อมูล */}
      <div className="p-5">
        
        {/* หัวข้อ */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#7b5e57] transition-colors duration-200 line-clamp-1">
          {property.title}
        </h3>
        
        {/* ที่อยู่ */}
        <div className="flex items-center gap-1 text-gray-600 mb-4">
          <MapPin className="w-4 h-4 text-[#a2836e] flex-shrink-0" />
          <span className="text-sm line-clamp-1">{property.location}</span>
        </div>

        {/* รายละเอียด */}
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

        {/* ราคาและปุ่ม */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">ราคา</p>
            <p className="text-xl font-bold bg-gradient-to-r from-[#7b5e57] to-[#a2836e] bg-clip-text text-transparent">
              ฿{Number(property.price)?.toLocaleString()}
            </p>
          </div>

          <Link 
            to={`/property/${property._id}`}
            state={{ from: location.pathname }} // ✅ ส่ง state ไปด้วย
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

  console.log('🎨 PropertyCardList rendering...');
  console.log('🎨 Context:', context);

  if (!context) {
    console.log('❌ No context found!');
    return null;
  }
  
  const { properties, loading } = context;
  
  console.log('📊 PropertyCardList - Properties:', properties);
  console.log('📊 PropertyCardList - Count:', properties.length);
  console.log('📊 PropertyCardList - Loading:', loading);

  if (loading) {
    console.log('⏳ Showing loading state');
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-[#7b5e57] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!loading && properties.length === 0) {
    console.log('⚠️ No properties to display');
    return (
      <p className="text-center text-gray-600 mt-10">
        ไม่มีผลลัพธ์
      </p>
    );
  }

  console.log('✅ Rendering', properties.length, 'property cards');
  return (
    <div className="grid grid-cols-4 gap-6">
      {properties.map((property, index) => {
        console.log(`🏠 Rendering card ${index + 1}:`, property.title);
        return <PropertyCard key={property._id} property={property} />;
      })}
    </div>
  );
};

export default PropertyCardList;