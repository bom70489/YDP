import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from 'react';
import React from 'react';
import { SearchContext } from "../context/AppContext";
import { AuthContext } from "../context/UserContext";
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline } from 'react-leaflet';
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
  Navigation,
} from "lucide-react";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BG_COLOR = " bg-stone-50";
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Custom property marker icon (สีทอง/bronze)
const propertyIcon = L.divIcon({
  className: 'custom-property-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #b58363 0%, #d7a77a 100%);
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        transform: rotate(45deg);
        color: white;
        font-size: 20px;
        font-weight: bold;
      ">🏠</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Custom user location icon (สีแดง)
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;
    ">
      <span style="color: white; font-size: 18px;">📍</span>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// ฟังก์ชันคำนวณระยะทาง (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
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
        padding: [80, 80],
        maxZoom: 14,
        animate: true,
        duration: 1
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
          const res = await axios.get(`${API_BASE_URL}/property/${id}`);
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
          `${API_BASE_URL}/api/favorites/check/${id}`,
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
        const response = await axios.post(
          `${API_BASE_URL}/api/favorites/remove`,
          { propertyId: id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        if (response.data.success) {
          setIsFavorite(false);
          toast.success('ลบออกจากรายการโปรดแล้ว');
        }
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/api/favorites/add`,
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

            {/* Improved Map Section */}
            <div className="pt-6 mt-6 border-t">
              <h3 className="text-xl font-bold text-stone-700 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-amber-600" />
                ที่ตั้ง
              </h3>
              
              {property.coordinates && property.coordinates.lat && property.coordinates.lng ? (
                <div className="space-y-4">
                  {/* Leaflet Map */}
                  <div className="relative w-full h-[450px] rounded-2xl overflow-hidden shadow-xl border-4 border-gradient-to-br from-[#b58363] to-[#d7a77a]">
                    <MapContainer
                      key={`${property.coordinates.lat}-${property.coordinates.lng}-${userLocation?.lat || 0}`}
                      center={[property.coordinates.lat, property.coordinates.lng]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                      className="z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {/* Auto-fit bounds */}
                      {userLocation && (
                        <FitBounds 
                          bounds={[
                            [property.coordinates.lat, property.coordinates.lng],
                            [userLocation.lat, userLocation.lng]
                          ]}
                        />
                      )}

                      {/* Property Marker */}
                      <Marker 
                        position={[property.coordinates.lat, property.coordinates.lng]}
                        icon={propertyIcon}
                      >
                        <Tooltip 
                          permanent 
                          direction="top"
                          className="custom-tooltip font-semibold"
                          offset={[0, -10]}
                        >
                          🏠 {property.title}
                        </Tooltip>
                        <Popup className="custom-popup">
                          <div className="text-center p-2">
                            <strong className="text-amber-700 text-lg">{property.title}</strong><br/>
                            <span className="text-gray-600">{property.location}</span><br/>
                            <span className="text-amber-600 font-bold text-xl">฿{Number(property.price)?.toLocaleString()}</span>
                          </div>
                        </Popup>
                      </Marker>

                      {/* User Location Marker */}
                      {userLocation && (
                        <>
                          <Marker 
                            position={[userLocation.lat, userLocation.lng]}
                            icon={userIcon}
                          >
                            <Tooltip 
                              permanent 
                              direction="top"
                              className="custom-tooltip font-semibold"
                              offset={[0, -10]}
                            >
                              📍 ตำแหน่งของคุณ
                            </Tooltip>
                            <Popup>
                              <div className="text-center p-2">
                                <strong className="text-red-600">📍 ตำแหน่งของคุณ</strong><br/>
                                <span className="text-xs text-gray-600">
                                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                                </span>
                              </div>
                            </Popup>
                          </Marker>

                          {/* Distance Line */}
                          <Polyline
                            positions={[
                              [property.coordinates.lat, property.coordinates.lng],
                              [userLocation.lat, userLocation.lng]
                            ]}
                            pathOptions={{
                              color: '#b58363',
                              weight: 3,
                              opacity: 0.7,
                              dashArray: '10, 10',
                            }}
                          />
                        </>
                      )}
                    </MapContainer>

                    {/* Map Overlay - Distance Badge */}
                    {userLocation && (
                      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 border-amber-600">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-amber-700">
                            {calculateDistance(
                              userLocation.lat, userLocation.lng,
                              property.coordinates.lat, property.coordinates.lng
                            ).toFixed(2)} km
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Location Info Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border-2 border-amber-200 shadow-md">
                    <div className="space-y-3">
                      {/* Address */}
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-stone-700 text-lg">{property.location}</p>
                          <span className="text-sm text-stone-500">
                            พิกัด: {property.coordinates.lat.toFixed(4)}, {property.coordinates.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {/* Distance Badge */}
                      {userLocation && (
                        <div className="bg-white p-3 rounded-lg border-2 border-amber-300">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-stone-600">ระยะทางจากคุณ:</span>
                            <span className="text-lg font-bold text-amber-700">
                              📍 {calculateDistance(
                                userLocation.lat, userLocation.lng,
                                property.coordinates.lat, property.coordinates.lng
                              ).toFixed(2)} กม.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {userLocation && (
                          <button
                            onClick={requestUserLocation}
                            disabled={isRequestingLocation}
                            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-amber-50 disabled:bg-gray-100 text-amber-700 px-4 py-2.5 rounded-lg border-2 border-amber-300 transition-all duration-200 font-medium text-sm disabled:cursor-not-allowed"
                          >
                            <Navigation className={`w-4 h-4 ${isRequestingLocation ? 'animate-spin' : ''}`} />
                            {isRequestingLocation ? 'กำลังอัพเดต...' : 'อัพเดตตำแหน่ง'}
                          </button>
                        )}
                        
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${property.coordinates.lat},${property.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-md"
                        >
                          <MapPin className="w-4 h-4" />
                          เปิดใน Google Maps
                        </a>
                      </div>

                      {/* Error Message */}
                      {locationError && !userLocation && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-600 mb-2">⚠️ {locationError}</p>
                          <button
                            onClick={requestUserLocation}
                            disabled={isRequestingLocation}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
                          >
                            {isRequestingLocation ? 'กำลังขอสิทธิ์...' : '📍 ขอสิทธิ์เข้าถึงตำแหน่งอีกครั้ง'}
                          </button>
                        </div>
                      )}
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

      {/* Custom CSS for map tooltips */}
      <style>{`
        .custom-tooltip {
          background-color: white !important;
          border: 2px solid #b58363 !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          font-weight: 600 !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default ShowDetail;