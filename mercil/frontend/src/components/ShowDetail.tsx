import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from 'react'
import { SearchContext } from "../context/AppContext";
import { AuthContext } from "../context/UserContext"; // ✅ เพิ่ม
import axios from "axios";
import { toast } from 'react-toastify'; // ✅ เพิ่ม
import {
  CircleArrowLeft,
  Heart,
  LandPlot,
  Bed,
  Bath,
  Star,
  Archive,
  Share2,
  BookOpen,
} from "lucide-react";

const BG_COLOR = " bg-stone-50";

const ShowDetail = () => {
  const { id } = useParams();
  const context = useContext(SearchContext);
  const authContext = useContext(AuthContext); // ✅ เพิ่ม
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // ✅ เพิ่ม state สำหรับ favorite
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const user = authContext?.user; // ✅ ดึง user

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    let propFromContext;
    if (context?.properties) {
      propFromContext = context.properties.find(p => p._id === id);
    }

    if (propFromContext) {
      setProperty(propFromContext);
      setLoading(false);
    } else {
      const fetchProperty = async () => {
        try {
          console.log('📡 Fetching from API:', `http://localhost:8000/property/${id}`);
          const res = await axios.get(`http://127.0.0.1:8000/property/${id}`);
          setProperty(res.data);
          setError(false);
        } catch (err) {
          if (axios.isAxiosError(err)) {
            console.error("Error response:", err.response?.data);
            console.error("Error status:", err.response?.status);
          }
          setProperty(null);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      fetchProperty();
    }
  }, [id, context?.properties]);

  // ✅ เช็คว่าอยู่ใน favorites หรือไม่
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.token || !id) {
        setIsFavorite(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:4000/api/user/favorite/check/${id}`,
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
  }, [user, id]);

  // ✅ Toggle favorite
  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!id) return;

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        // ลบออกจาก favorites
        const response = await axios.delete(
          'http://localhost:4000/api/user/favorite/remove',
          {
            data: { propertyId: id },
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );

        if (response.data.success) {
          setIsFavorite(false);
          toast.success('ลบออกจากรายการโปรดแล้ว');
        }
      } else {
        // เพิ่มเข้า favorites
        const response = await axios.post(
          'http://localhost:4000/api/user/favorite/add',
          { propertyId: id },
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
      setFavoriteLoading(false);
    }
  };

  const handleBack = () => {
    const fromPath = (location.state as any)?.from || '/';
    navigate(fromPath, { replace: false });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-amber-50">
        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin mb-4"></div>
        <p className="text-stone-600 text-lg">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-amber-50">
        <h1 className="text-3xl font-bold text-amber-800 mb-4">ไม่พบข้อมูล</h1>
        <p className="text-stone-600 mb-2">ไม่พบทรัพย์สินที่มี ID: <code className="bg-stone-200 px-2 py-1 rounded">{id}</code></p>
        <p className="text-stone-500 text-sm mb-6">กรุณาตรวจสอบลิงก์หรือกลับไปยังหน้าหลัก</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition duration-150 shadow-md"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${BG_COLOR} font-sans`}>
      <div className="pt-8 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <button
          onClick={handleBack}
          className="p-2 rounded-full text-stone-700 hover:bg-amber-100 transition duration-150"
          aria-label="Back"
        >
          <CircleArrowLeft className="w-7 h-7" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-10">
          {/* คอลัมน์ 1: รูปภาพ */}
          <div className="mb-6 lg:mb-0">
            <div className="relative overflow-hidden rounded-lg shadow-md mb-4">
              <img
                className="w-full h-auto object-cover transition-all duration-300"
                src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt={property.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                }}
              />
              <div className="absolute top-0 left-0 right-0 p-4 text-center text-xl font-bold bg-amber-900/10 text-stone-100">
              </div>
            </div>

            <div className="hidden lg:flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://placehold.co/100x70/bdae9c/3f3f46?text=picture+${i}`} className="rounded-md hover:shadow-md cursor-pointer transition" alt={`Thumbnail ${i}`} />
              ))}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="flex flex-col pb-4 mb-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-semibold text-stone-700">
                  {property.title}
                </h2>
                {/* ✅ ปุ่มหัวใจที่ทำงานได้ */}
                <button
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={`transition-all duration-200 ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart
                    className={`w-7 h-7 transition-all duration-200 ${
                      isFavorite
                        ? 'text-red-500 fill-red-500'
                        : 'text-amber-500 hover:text-red-500 hover:fill-red-500'
                    } cursor-pointer`}
                  />
                </button>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-amber-800 mb-2">
                $ {Number(property.price)?.toLocaleString()}
              </h1>
              <p className="text-sm text-stone-500">{property.location}</p>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                className="flex-1 flex items-center justify-center px-6 py-3 bg-[#be8368] text-white font-bold rounded-lg shadow-md hover:bg-amber-700/80 transition duration-200"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                จองอสังหา
              </button>
              <button
                className="flex-1 flex items-center justify-center px-6 py-3 bg-stone-200 text-stone-700 font-bold rounded-lg shadow-md hover:bg-stone-300 transition duration-200"
              >
                <Share2 className="w-5 h-5 mr-2" />
                แชร์
              </button>
            </div>

            {/* รายละเอียดทรัพย์สิน */}
            <h2 className="text-2xl font-bold text-stone-700 pb-2 mb-4">
              รายละเอียด
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Bed className="mr-3 w-5 h-5 text-amber-600" />
                <p className="text-stone-700 text-lg">ห้องนอน: <span className="font-semibold">{property.bedrooms}</span></p>
              </div>

              <div className="flex items-center">
                <Bath className="mr-3 w-5 h-5 text-amber-600" />
                <p className="text-stone-700 text-lg">ห้องน้ำ: <span className="font-semibold">{property.bathrooms}</span></p>
              </div>

              <div className="flex items-center">
                <LandPlot className="mr-3 w-5 h-5 text-amber-600" />
                <p className="text-stone-700 text-lg">พื้นที่: <span className="font-semibold">{property.area}</span></p>
              </div>

              <div className="flex items-center">
                <Star className="mr-3 w-5 h-5 text-yellow-500 fill-yellow-500" />
                <p className="text-stone-700 text-lg">คะแนน: <span className="font-semibold">{property.rating}</span></p>
              </div>

              <div className="flex items-center">
                <Archive className="mr-3 w-5 h-5 text-amber-600" />
                <p className="text-stone-700 text-lg">สถานะ: <span className="font-semibold">{property.type}</span></p>
              </div>
            </div>

            {/* คำอธิบายเพิ่มเติม */}
            <div className="pt-6 mt-6">
              <h3 className="text-2xl font-bold text-stone-700 mb-4">คำอธิบายเพิ่มเติม</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                {property.description}
              </p>
            </div>

            <div className="pt-6 mt-6">
              <h3 className="text-2xl font-bold text-stone-700 mb-4">Google Map</h3>
              <div className="w-full h-64 rounded-lg bg-[#C99A85] flex items-center justify-center text-stone-700 font-semibold shadow-inner">
                [ Placeholder for map ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;