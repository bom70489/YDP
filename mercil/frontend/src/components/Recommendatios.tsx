import { useContext, useState, useEffect } from 'react';
import { SearchContext } from '../context/AppContext';
import PropertyCardList from './Propertycard.tsx';
import { ChevronDown } from 'lucide-react';

const RecommendationsSection = () => {
  const context = useContext(SearchContext);
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  if (!context) return null;
  
  const { recommendations, loading } = context;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset showAll when recommendations change
  useEffect(() => {
    setShowAll(false);
  }, [recommendations]);

  const MOBILE_INITIAL_COUNT = 5;
  const shouldShowLoadMore = isMobile && recommendations.length > MOBILE_INITIAL_COUNT;
  const displayedProperties = shouldShowLoadMore && !showAll 
    ? recommendations.slice(0, MOBILE_INITIAL_COUNT)
    : recommendations;

  if (loading && recommendations.length === 0) {
    return (
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-4">
              ทรัพย์สินแนะนำ
            </h2>
            <p className="text-base md:text-xl text-amber-900">
              คัดสรรทรัพย์สินที่น่าสนใจสำหรับคุณ
            </p>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-amber-900 font-medium text-sm md:text-base">กำลังโหลดทรัพย์สินแนะนำ...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-4">
              ทรัพย์สินแนะนำ
            </h2>
            <p className="text-base md:text-xl text-amber-900">
              คัดสรรทรัพย์สินที่น่าสนใจสำหรับคุณ
            </p>
          </div>
          
          <div className="text-center text-amber-700 py-16">
            <p className="text-base md:text-lg">ยังไม่มีทรัพย์สินแนะนำ</p>
            <p className="text-xs md:text-sm mt-2">ลองค้นหาหรือเพิ่มทรัพย์สินในรายการโปรดเพื่อรับคำแนะนำ</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-transparent to-orange-50/20">
      <div className="max-w-7xl mx-auto">
        {/* Header with decorative elements */}
        <div className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            ทรัพย์สินแนะนำ
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-12 md:w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full"></div>
            <p className="text-base md:text-xl text-amber-900 font-semibold">
              คัดสรรพิเศษ <span className="text-xl md:text-2xl text-orange-600">{recommendations.length}</span> รายการ
            </p>
            <div className="h-1 w-12 md:w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full"></div>
          </div>
          <p className="text-sm md:text-base text-amber-700">
            ที่น่าสนใจสำหรับคุณ
          </p>
        </div>
        
        {/* Property Cards */}
        <PropertyCardList properties={displayedProperties} />
        
        {/* Load More Button - Mobile Only */}
        {shouldShowLoadMore && !showAll && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="
                group relative px-8 py-3 rounded-full
                bg-gradient-to-r from-orange-600 to-amber-600
                hover:from-orange-700 hover:to-amber-700
                text-white font-semibold shadow-lg
                transition-all duration-300 hover:scale-105 active:scale-95
                flex items-center gap-2
              "
            >
              <span>ดูเพิ่มเติม</span>
              <span className="text-sm opacity-80">
                ({recommendations.length - MOBILE_INITIAL_COUNT} รายการ)
              </span>
              <ChevronDown className="w-5 h-5 transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        )}

        {/* Show Less Button - Mobile Only */}
        {shouldShowLoadMore && showAll && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                setShowAll(false);
                // Scroll to top of section
                const section = document.querySelector('section');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="
                group relative px-8 py-3 rounded-full
                bg-white border-2 border-orange-600
                hover:bg-orange-50
                text-orange-600 font-semibold shadow-lg
                transition-all duration-300 hover:scale-105 active:scale-95
                flex items-center gap-2
              "
            >
              <span>แสดงน้อยลง</span>
              <ChevronDown className="w-5 h-5 transition-transform rotate-180 group-hover:-translate-y-1" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendationsSection;