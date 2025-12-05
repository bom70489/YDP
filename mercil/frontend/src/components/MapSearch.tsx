import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { MapPin, Home , Navigation } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Property {
  _id: string;
  title: string;
  price: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  image: string ;
  type_id: number;
}

interface MapSearchResponse {
  count: number;
  center: { lat: number; lng: number };
  radius_km: number;
  results: Property[];
}

const defaultCenter = {
  lat: 13.7563, // Bangkok
  lng: 100.5018,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

const MapSearch = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Responsive map height
  const mapContainerStyle = useMemo(() => ({
    width: '100%',
    height: typeof window !== 'undefined' && window.innerWidth < 768 ? '400px' : '600px',
    borderRadius: '20px',
  }), []);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Filter properties with valid coordinates
  const validProperties = properties.filter(
    (p) => p.coordinates && p.coordinates.lat && p.coordinates.lng && 
           p.coordinates.lat !== 0 && p.coordinates.lng !== 0
  );

  // Search properties on map
  const searchProperties = async (lat: number, lng: number, radius: number) => {
    setLoading(true);
    try {
      const response = await axios.get<MapSearchResponse>(
        `${API_BASE_URL}/map_search`,
        {
          params: {
            lat,
            lng,
            radius_km: radius,
            limit: 50,
          },
        }
      );

      setProperties(response.data.results);
    } catch (error) {
      console.error('Map search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location on mount
  useEffect(() => {
    if (isInitialized) return;

    if (navigator.geolocation) {
      setUseCurrentLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(userLocation);
          searchProperties(userLocation.lat, userLocation.lng, radiusKm);
          setUseCurrentLocation(false);
          setIsInitialized(true);
        },
        (error) => {
          console.warn('Could not get user location, using default (Bangkok):', error);
          searchProperties(defaultCenter.lat, defaultCenter.lng, radiusKm);
          setUseCurrentLocation(false);
          setIsInitialized(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      searchProperties(defaultCenter.lat, defaultCenter.lng, radiusKm);
      setIsInitialized(true);
    }
  }, [isInitialized, radiusKm]);

  // Handle map click
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newCenter = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setCenter(newCenter);
      searchProperties(newCenter.lat, newCenter.lng, radiusKm);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    setUseCurrentLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newCenter);
          searchProperties(newCenter.lat, newCenter.lng, radiusKm);
          map?.panTo(newCenter);
          setUseCurrentLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setUseCurrentLocation(false);
        }
      );
    }
  };

  // Handle radius change
  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    searchProperties(center.lat, center.lng, newRadius);
    
    if (map && typeof google !== 'undefined') {
      const bounds = new google.maps.LatLngBounds();
      const circleCenter = new google.maps.LatLng(center.lat, center.lng);
      
      const radiusInMeters = newRadius * 1000;
      
      const north = google.maps.geometry.spherical.computeOffset(circleCenter, radiusInMeters, 0);
      const south = google.maps.geometry.spherical.computeOffset(circleCenter, radiusInMeters, 180);
      const east = google.maps.geometry.spherical.computeOffset(circleCenter, radiusInMeters, 90);
      const west = google.maps.geometry.spherical.computeOffset(circleCenter, radiusInMeters, 270);
      
      bounds.extend(north);
      bounds.extend(south);
      bounds.extend(east);
      bounds.extend(west);
      
      map.fitBounds(bounds);
    }
  };

  if (!isLoaded || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px] md:min-h-[600px] bg-[#f9f7f5] rounded-2xl md:rounded-3xl">
        <div className="text-center px-4">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-[#b58363] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8e5d44] font-medium mb-2 text-sm md:text-base">
            {!isLoaded ? 'กำลังโหลดแผนที่...' : 'กำลังค้นหาตำแหน่งของคุณ...'}
          </p>
          {!isInitialized && (
            <p className="text-[#a0856f] text-xs md:text-sm">
              กรุณาอนุญาตให้เข้าถึงตำแหน่งของคุณ
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Controls */}
      <div className="bg-gradient-to-r from-[#f0e6e0] to-[#e8ddd5] rounded-xl md:rounded-2xl shadow-lg p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-3 md:gap-4">
          {/* Radius Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#b58363]" />
              <span className="text-[#7a4f35] font-medium text-sm md:text-base">รัศมีค้นหา:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[2, 5, 10, 20, 30].map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleRadiusChange(radius)}
                  className={`
                    px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all duration-200 text-sm md:text-base
                    ${radiusKm === radius
                      ? 'bg-gradient-to-r from-[#b58363] to-[#d7a77a] text-white shadow-md'
                      : 'bg-white text-[#8e5d44] hover:bg-[#f5ede8]'
                    }
                  `}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            {/* Current Location Button */}
            <button
              onClick={getCurrentLocation}
              disabled={useCurrentLocation}
              className="
                flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full
                bg-gradient-to-r from-[#b58363] to-[#d7a77a]
                hover:from-[#8e5d44] hover:to-[#b58363]
                text-white font-medium shadow-md text-sm md:text-base
                transition-all duration-300 hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Navigation className={`w-4 h-4 md:w-5 md:h-5 ${useCurrentLocation ? 'animate-spin' : ''}`} />
              <span>ตำแหน่งปัจจุบัน</span>
            </button>

            {/* Results Count */}
            <div className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-white rounded-full shadow" title={`แสดง ${validProperties.length} จาก ${properties.length} รายการ`}>
              <Home className="w-4 h-4 md:w-5 md:h-5 text-[#b58363]" />
              <span className="text-[#7a4f35] font-semibold text-sm md:text-base">{validProperties.length}</span>
              <span className="text-[#a0856f] text-xs md:text-sm">ทรัพย์สิน</span>
              {properties.length > validProperties.length && (
                <span className="text-xs text-stone-400 hidden sm:inline">
                  ({properties.length - validProperties.length} ซ่อน)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl md:rounded-3xl overflow-hidden shadow-xl md:shadow-2xl">
        {loading && (
          <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 shadow-lg flex items-center gap-2 md:gap-3">
              <div className="w-4 h-4 md:w-5 md:h-5 border-2 md:border-3 border-[#b58363] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[#7a4f35] font-medium text-xs md:text-sm">กำลังค้นหา...</span>
            </div>
          </div>
        )}

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={mapOptions}
        >
          {/* Search Radius Circle */}
          <Circle
            key="search-radius-circle"
            center={center}
            radius={radiusKm * 1000}
            options={{
              fillColor: '#b58363',
              fillOpacity: 0.15,
              strokeColor: '#b58363',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: false,
              draggable: false,
              editable: false,
              visible: true,
              zIndex: 1
            }}
          />

          {/* Center Marker */}
          <Marker
            position={center}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#b58363',
              fillOpacity: 0.8,
              strokeColor: 'white',
              strokeWeight: 3,
            }}
          />

          {/* Property Markers */}
          {validProperties.map((property) => (
            <Marker
              key={property._id}
              position={property.coordinates}
              onClick={() => setSelectedProperty(property)}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30c0-11.05-8.95-20-20-20z" 
                      fill="#b58363" stroke="white" stroke-width="2"/>
                    <circle cx="20" cy="20" r="8" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(40, 50),
              }}
            />
          ))}

          {/* InfoWindow */}
          {selectedProperty && (
            <InfoWindow
              position={selectedProperty.coordinates}
              onCloseClick={() => setSelectedProperty(null)}
            >
              <div className="p-2 max-w-[280px] sm:max-w-xs">
                <img
                  src={selectedProperty.image || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170"}
                  alt={selectedProperty.title}
                  className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2"
                />
                <h3 className="font-bold text-[#7a4f35] text-sm sm:text-base mb-2 line-clamp-2">
                  {selectedProperty.title}
                </h3>
                <div className="flex items-center gap-2 text-[#b58363] font-semibold text-sm sm:text-base">
                  <span>฿ {selectedProperty.price.toLocaleString()}</span>
                </div>
                <a
                  href={`/property/${selectedProperty._id}`}
                  className="mt-3 block text-center px-4 py-2 bg-gradient-to-r from-[#b58363] to-[#d7a77a] text-white rounded-lg hover:shadow-md transition text-sm"
                >
                  ดูรายละเอียด
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Instructions */}
      <div className="text-center text-xs md:text-sm text-[#a0856f]">
        <p className="flex items-center justify-center gap-2">
          <MapPin className="w-3 h-3 md:w-4 md:h-4" />
          <span>คลิกบนแผนที่เพื่อค้นหาทรัพย์สินรอบๆ บริเวณนั้น</span>
        </p>
      </div>
    </div>
  );
};

export default MapSearch;