import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { MapPin, Home, DollarSign, Navigation } from 'lucide-react';
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
  image: string;
  type_id: number;
}

interface MapSearchResponse {
  count: number;
  center: { lat: number; lng: number };
  radius_km: number;
  results: Property[];
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '20px',
};

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
          // Fallback to Bangkok if location access denied
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
      // Browser doesn't support geolocation
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
    
    // Auto-zoom to fit the circle
    if (map) {
      const bounds = new google.maps.LatLngBounds();
      const circleCenter = new google.maps.LatLng(center.lat, center.lng);
      
      // Calculate bounds for the circle
      const radiusInMeters = newRadius * 1000;
      
      // North point
      const north = google.maps.geometry.spherical.computeOffset(
        circleCenter,
        radiusInMeters,
        0
      );
      // South point
      const south = google.maps.geometry.spherical.computeOffset(
        circleCenter,
        radiusInMeters,
        180
      );
      // East point
      const east = google.maps.geometry.spherical.computeOffset(
        circleCenter,
        radiusInMeters,
        90
      );
      // West point
      const west = google.maps.geometry.spherical.computeOffset(
        circleCenter,
        radiusInMeters,
        270
      );
      
      bounds.extend(north);
      bounds.extend(south);
      bounds.extend(east);
      bounds.extend(west);
      
      map.fitBounds(bounds);
    }
  };

  if (!isLoaded || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-[#f9f7f5] rounded-3xl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#b58363] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8e5d44] font-medium mb-2">
            {!isLoaded ? 'กำลังโหลดแผนที่...' : 'กำลังค้นหาตำแหน่งของคุณ...'}
          </p>
          {!isInitialized && (
            <p className="text-[#a0856f] text-sm">
              กรุณาอนุญาตให้เข้าถึงตำแหน่งของคุณ
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-gradient-to-r from-[#f0e6e0] to-[#e8ddd5] rounded-2xl shadow-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Radius Selector */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#b58363]" />
            <span className="text-[#7a4f35] font-medium">รัศมีค้นหา:</span>
            <div className="flex gap-2">
              {[2, 5, 10, 20, 30].map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleRadiusChange(radius)}
                  className={`
                    px-4 py-2 rounded-full transition-all duration-200
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

          {/* Current Location Button */}
          <button
            onClick={getCurrentLocation}
            disabled={useCurrentLocation}
            className="
              flex items-center gap-2 px-5 py-2.5 rounded-full
              bg-gradient-to-r from-[#b58363] to-[#d7a77a]
              hover:from-[#8e5d44] hover:to-[#b58363]
              text-white font-medium shadow-md
              transition-all duration-300 hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Navigation className={`w-5 h-5 ${useCurrentLocation ? 'animate-spin' : ''}`} />
            <span>ตำแหน่งปัจจุบัน</span>
          </button>

          {/* Results Count */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow" title={`แสดง ${validProperties.length} จาก ${properties.length} รายการ`}>
            <Home className="w-5 h-5 text-[#b58363]" />
            <span className="text-[#7a4f35] font-semibold">{validProperties.length}</span>
            <span className="text-[#a0856f] text-sm">ทรัพย์สิน</span>
            {properties.length > validProperties.length && (
              <span className="text-xs text-stone-400">
                ({properties.length - validProperties.length} ซ่อน)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        {loading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
              <div className="w-5 h-5 border-3 border-[#b58363] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[#7a4f35] font-medium">กำลังค้นหา...</span>
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
            center={center}
            radius={radiusKm * 1000} // Convert km to meters
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
              <div className="p-2 max-w-xs">
                <img
                  src={selectedProperty.image}
                  alt={selectedProperty.title}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <h3 className="font-bold text-[#7a4f35] mb-2 line-clamp-2">
                  {selectedProperty.title}
                </h3>
                <div className="flex items-center gap-2 text-[#b58363] font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span>฿{selectedProperty.price.toLocaleString()}</span>
                </div>
                <a
                  href={`/property/${selectedProperty._id}`}
                  className="mt-3 block text-center px-4 py-2 bg-gradient-to-r from-[#b58363] to-[#d7a77a] text-white rounded-lg hover:shadow-md transition"
                >
                  ดูรายละเอียด
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-[#a0856f]">
        <p className="flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>คลิกบนแผนที่เพื่อค้นหาทรัพย์สินรอบๆ บริเวณนั้น</span>
        </p>
      </div>
    </div>
  );
};

export default MapSearch;