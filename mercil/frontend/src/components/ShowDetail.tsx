import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from 'react';
import React from 'react';
import { SearchContext } from "../context/AppContext";
import { AuthContext } from "../context/UserContext";
import { MapContainer, TileLayer, Marker, Popup, useMap , Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from "axios";
import { toast } from 'react-toastify';
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
  MapPin,
} from "lucide-react";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BG_COLOR = " bg-stone-50";

// Custom marker icon (สีน้ำเงิน - ทรัพย์สิน)
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom user location icon (สีแดง - ตำแหน่งผู้ใช้)
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ฟังก์ชันคำนวณระยะทาง (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // รัศมีโลก (กม.)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Component สำหรับปรับ bounds ของแผนที่
const FitBounds = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [50, 50], // padding รอบขอบแผนที่
        maxZoom: 14 // ไม่ให้ zoom เข้าใกล้เกินไป
      });
    }
  }, [bounds, map]);
  
  return null;
};

const ShowDetail = () => {
  const { id } = useParams();
  const context = useContext(SearchContext);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // State สำหรับตำแหน่งผู้ใช้
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const user = authContext?.user;
  
  const requestUserLocation = () => {
    setIsRequestingLocation(true);
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setLocationError("เบราว์เซอร์ไม่รองรับการหาตำแหน่ง");
      setIsRequestingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userPos);
        setLocationError(null);
        setIsRequestingLocation(false);
        toast.success('อัพเดตตำแหน่งสำเร็จ! 📍');
      },
      (error) => {      
        let errorMsg = "";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "คุณได้ปฏิเสธการเข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "ไม่สามารถหาตำแหน่งได้ กรุณาตรวจสอบ GPS";
            break;
          case error.TIMEOUT:
            errorMsg = "หมดเวลาในการหาตำแหน่ง กรุณาลองใหม่อีกครั้ง";
            break;
          default:
            errorMsg = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        }
        setLocationError(errorMsg);
        setIsRequestingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    requestUserLocation();
  }, []);

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
          const res = await axios.get(`http://127.0.0.1:8000/property/${id}`);
          setProperty(res.data);
          setError(false);
        } catch (err) {
          if (axios.isAxiosError(err)) {
            console.error("❌ Error response:", err.response?.data);
            console.error("❌ Error status:", err.response?.status);
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
        setIsFavorite(false);
      }
    };

    checkFavorite();
  }, [user, id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!id) return;

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
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
                className="w-full h-96 object-cover transition-all duration-300"
                src={property.image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170"}
                alt={property.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170";
                }}
              />
            </div>

            <div className="hidden lg:flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <img 
                  key={i} 
                  src={`https://placehold.co/100x70/bdae9c/3f3f46?text=picture+${i}`} 
                  className="rounded-md hover:shadow-md cursor-pointer transition" 
                  alt={`Thumbnail ${i}`} 
                />
              ))}
            </div>
          </div>

          {/* คอลัมน์ 2: รายละเอียด */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="flex flex-col pb-4 mb-6 border-b">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-semibold text-stone-700">
                  {property.title}
                </h2>
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
                ฿ {Number(property.price)?.toLocaleString()}
              </h1>
              <div className="flex items-center text-sm text-stone-500">
                <MapPin className="w-4 h-4 mr-1" />
                {property.location}
              </div>
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
            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <Bed className="mr-3 w-5 h-5 text-amber-600" />
                <p className="text-stone-700">ห้องนอน: <span className="font-semibold">{property.bedrooms}</span></p>
              </div>

              <div className="flex items-center">
                <Bath className="mr-3 w-5 h-5 text-amber-600" />
                <p className="text-stone-700">ห้องน้ำ: <span className="font-semibold">{property.bathrooms}</span></p>
              </div>

              <div className="flex items-center">
                <LandPlot className="mr-3 w-5 h-5 text-amber-600" />
                <p className="text-stone-700">พื้นที่: <span className="font-semibold">{property.area} ตร.ม.</span></p>
              </div>

              <div className="flex items-center">
                <Star className="mr-3 w-5 h-5 text-yellow-500 fill-yellow-500" />
                <p className="text-stone-700">คะแนน: <span className="font-semibold">{property.rating}</span></p>
              </div>

              <div className="flex items-center">
                <Archive className="mr-3 w-5 h-5 text-amber-600" />
                <p className="text-stone-700">สถานะ: <span className="font-semibold">{property.type}</span></p>
              </div>
            </div>

            {/* คำอธิบายเพิ่มเติม */}
            <div className="pt-6 mt-6 border-t">
              <h3 className="text-xl font-bold text-stone-700 mb-3">คำอธิบายเพิ่มเติม</h3>
              <p className="text-gray-600 leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Google Map with Leaflet */}
            <div className="pt-6 mt-6 border-t">
              <h3 className="text-xl font-bold text-stone-700 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-amber-600" />
                ที่ตั้ง
              </h3>
              
              {property.coordinates && property.coordinates.lat && property.coordinates.lng ? (
                <div className="space-y-3">
                  {/* Leaflet Map - ใช้ key เพื่อ force re-render เมื่อ coordinates เปลี่ยน */}
                  <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
                    <MapContainer
                      key={`${property.coordinates.lat}-${property.coordinates.lng}-${userLocation?.lat || 0}`}
                      center={[property.coordinates.lat, property.coordinates.lng]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {/* ปรับ bounds ให้แสดงทั้งทรัพย์สินและตำแหน่งผู้ใช้ */}
                      {userLocation && (
                        <FitBounds 
                          bounds={[
                            [property.coordinates.lat, property.coordinates.lng],
                            [userLocation.lat, userLocation.lng]
                          ]}
                        />
                      )}

                      <Marker 
                        position={[property.coordinates.lat, property.coordinates.lng]}
                        icon={customIcon}
                      >
                        <Tooltip 
                          permanent 
                          direction="top"
                          className="custom-tooltip"
                        >
                          <div className="text-center font-semibold">
                            🏠 {property.title}
                          </div>
                        </Tooltip>
                        <Popup>
                          <div className="text-center">
                            <strong>{property.title}</strong><br/>
                            {property.location}
                          </div>
                        </Popup>
                      </Marker>

                      {/* User Location Marker (สีแดง) */}
                      {userLocation && (
                        <Marker 
                          position={[userLocation.lat, userLocation.lng]}
                          icon={userLocationIcon}
                        >
                          <Tooltip 
                            permanent 
                            direction="top"
                            className="custom-tooltip"
                          >
                            <div className="text-center font-semibold">
                              📍 ตำแหน่งของคุณ
                            </div>
                          </Tooltip>
                          <Popup>
                            <div className="text-center">
                              <strong>📍 ตำแหน่งของคุณ</strong><br/>
                              <span className="text-xs text-gray-600">
                                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                              </span>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  
                  {/* Location Info */}
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-stone-700">{property.location}</p>
                        <span className="text-xs text-stone-500 mt-1">
                          พิกัด: {property.coordinates.lat.toFixed(4)}, {property.coordinates.lng.toFixed(4)}
                        </span>
                        
                        {/* แสดงระยะทางเมื่อมีตำแหน่งผู้ใช้ */}
                        {userLocation && (
                          <span className="text-xs text-amber-700 font-medium ml-5">
                            📍 ห่างจากคุณประมาณ {calculateDistance(
                              userLocation.lat, userLocation.lng,
                              property.coordinates.lat, property.coordinates.lng
                            ).toFixed(2)} กม.
                          </span>
                        )}

                        {/* แสดง error และปุ่มลองใหม่ */}
                        {locationError && !userLocation && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-red-500">
                              ⚠️ {locationError}
                            </p>
                            <button
                              onClick={requestUserLocation}
                              disabled={isRequestingLocation}
                              className="text-xs bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-md transition-colors duration-200 font-medium"
                            >
                              {isRequestingLocation ? 'กำลังขอตำแหน่ง...' : '📍 ขอสิทธิ์เข้าถึงตำแหน่งอีกครั้ง'}
                            </button>
                          </div>
                        )}

                        {/* ปุ่มรีเฟรชตำแหน่ง (เมื่อมีตำแหน่งแล้ว) */}
                        {userLocation && (
                          <div>
                          <button
                            onClick={requestUserLocation}
                            disabled={isRequestingLocation}
                            className="text-sm text-amber-600 hover:text-amber-800 disabled:text-gray-400 mt-2 font-medium inline-flex items-center"
                          >
                            {isRequestingLocation ? '🔄 กำลังอัพเดต...' : '🔄 อัพเดตตำแหน่งของฉัน'}
                          </button>
                          </div>
                        )}
                        
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${property.coordinates.lat},${property.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium mt-2 inline-block"
                        >
                          เปิดใน Google Maps →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 rounded-lg bg-stone-200 flex items-center justify-center">
                  <p className="text-stone-500">ไม่มีข้อมูลที่ตั้ง</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;