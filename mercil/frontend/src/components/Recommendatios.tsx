import { useContext } from 'react';
import { SearchContext } from '../context/AppContext';
import PropertyCard from './Propertycard';

const Recommendations = () => {
  const context = useContext(SearchContext);
  
  if (!context) return null;
  
  const { recommendations , loading } = context;

  if (loading && recommendations.length === 0) {
    return (
      <section className="min-h-screen py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#956748] mb-4">
              ทรัพย์สินแนะนำ
            </h2>
            <p className="text-xl text-[#956748]">
              คัดสรรทรัพย์สินที่น่าสนใจสำหรับคุณ
            </p>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#b58363] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#8e5d44] font-medium">กำลังโหลดทรัพย์สินแนะนำ...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="min-h-screen py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#956748] mb-4">
              ทรัพย์สินแนะนำ
            </h2>
            <p className="text-xl text-[#956748]">
              คัดสรรทรัพย์สินที่น่าสนใจสำหรับคุณ
            </p>
          </div>
          
          <div className="text-center text-[#a0856f] py-16">
            <p className="text-lg">ยังไม่มีทรัพย์สินแนะนำ</p>
            <p className="text-sm mt-2">ลองค้นหาหรือเพิ่มทรัพย์สินในรายการโปรดเพื่อรับคำแนะนำ</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#956748] mb-4">
            ทรัพย์สินแนะนำ
          </h2>
          <p className="text-xl text-[#956748]">
            คัดสรรทรัพย์สินที่น่าสนใจสำหรับคุณ ({recommendations.length} รายการ)
          </p>
        </div>
        
        <PropertyCard properties={recommendations} />
      </div>
    </section>
  );
};

export default Recommendations;