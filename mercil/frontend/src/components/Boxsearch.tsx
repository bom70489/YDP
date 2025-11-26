import { useContext, useState, useEffect } from 'react'
import { Home, MapPin, DollarSign, Layers } from 'lucide-react';
import { SearchContext } from '../context/AppContext';

const Boxsearch = () => {
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [area, setArea] = useState('');
  const { search, clear } = useContext(SearchContext) || {}

  useEffect(() => {
    if (!search) return;

    if (!propertyType && !priceRange && !location && !area) {
      clear?.()
      return;
    }

    let q = "";
    let min_price: number | null = null;
    let max_price: number | null = null;

    if (propertyType) q += propertyType + " ";
    if (location) q += location + " ";

    switch(priceRange) {
      case "< 1 ล้าน":
        max_price = 1000000;
        q += "ไม่เกิน 1 ล้าน ";
        break;
      case "1-3 ล้าน":
        min_price = 1000000;
        max_price = 3000000;
        q += "1-3 ล้าน ";
        break;
      case "3-5 ล้าน":
        min_price = 3000000;
        max_price = 5000000;
        q += "3-5 ล้าน ";
        break;
      case "5-10 ล้าน":
        min_price = 5000000;
        max_price = 10000000;
        q += "5-10 ล้าน ";
        break;
      case "> 10 ล้าน":
        min_price = 10000000;
        q += "มากกว่า 10 ล้าน ";
        break;
    }

    console.log({ q, min_price, max_price });

    search(q.trim(), { min_price, max_price });
  }, [propertyType, priceRange, location , area]); 

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative group">
        <div className="
          absolute -inset-1 rounded-3xl blur-xl opacity-0 
          group-hover:opacity-70 transition duration-500
          bg-gradient-to-r from-[#c8b8b1] via-[#d7a77a] to-[#b58363]
        "></div>

        <div className="
          relative bg-[#f9f7f5] rounded-3xl shadow-xl p-8
          transition-all duration-300 group-hover:shadow-[#c8b8b1]/40
        ">
          <div className="grid grid-cols-4 gap-4">
            {/* ประเภททรัพย์สิน */}
            <div>
              <label className="text-sm font-medium text-[#7a4f35] mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-[#b58363]" /> ประเภททรัพย์สิน
              </label>
              <div className="relative">
                <select
                  value={propertyType}
                  onChange={(e) => {
                    setPropertyType(e.target.value);
                    setLocation(''); setPriceRange(''); setArea('');
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-[#f3ece7] border-2 border-[#d7c5b8] text-[#7a4f35] cursor-pointer outline-none transition-all duration-200 hover:border-[#c8b8b1] focus:border-[#b58363] focus:bg-white appearance-none"
                >
                  <option value="">เลือกประเภท</option>
                  <option value="บ้านเดี่ยว">บ้านเดี่ยว</option>
                  <option value="คอนโด">คอนโด</option>
                  <option value="ทาวน์โฮม">ทาวน์โฮม</option>
                </select>
              </div>
            </div>

            {/* จังหวัด */}
            <div>
              <label className="text-sm font-medium text-[#7a4f35] mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#b58363]" /> จังหวัด/พื้นที่
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f3ece7] border-2 border-[#d7c5b8] text-[#7a4f35] hover:border-[#c8b8b1] focus:border-[#b58363] transition-all duration-200 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="">เลือกพื้นที่</option>
                <option value="กรุงเทพ">กรุงเทพ</option>
                <option value="นนทบุรี">นนทบุรี</option>
                <option value="เชียงใหม่">เชียงใหม่</option>
              </select>
            </div>

            {/* ช่วงราคา */}
            <div>
              <label className="text-sm font-medium text-[#7a4f35] mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#b58363]" /> ช่วงราคา
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f3ece7] border-2 border-[#d7c5b8] text-[#7a4f35] hover:border-[#c8b8b1] focus:border-[#b58363] transition-all duration-200 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="">เลือกราคา</option>
                <option value="< 1 ล้าน">ต่ำกว่า 1 ล้าน</option>
                <option value="1-3 ล้าน">1 - 3 ล้าน</option>
                <option value="3-5 ล้าน">3 - 5 ล้าน</option>
                <option value="5-10 ล้าน">5 - 10 ล้าน</option>
                <option value="> 10 ล้าน">มากกว่า 10 ล้าน</option>
              </select>
            </div>

            {/* พื้นที่ */}
            <div>
              <label className="text-sm font-medium text-[#7a4f35] mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#b58363]" /> ขนาดพื้นที่
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f3ece7] border-2 border-[#d7c5b8] text-[#7a4f35] hover:border-[#c8b8b1] focus:border-[#b58363] transition-all duration-200 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="">เลือกขนาด</option>
                <option value="30-50 ตรม">30 - 50 ตรม</option>
                <option value="50-100 ตรม">50 - 100 ตรม</option>
                <option value="100+ ตรม">100+ ตรม</option>
              </select>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Boxsearch;