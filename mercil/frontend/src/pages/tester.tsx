import Navbar from '../components/navbar.jsx' // แก้ไข: เพิ่ม .jsx
import AISearch from '../components/AISearch.jsx' // แก้ไข: เพิ่ม .jsx
import Boxsearch from '../components/Boxsearch.jsx' // แก้ไข: เพิ่ม .jsx
import Propertycard from '../components/Propertycard.jsx' // แก้ไข: เพิ่ม .jsx

const Tester = () => {
  return (
    <div className='bg-gradient-to-br from-amber-50 via-white to-amber-50'>
     <Navbar />
      
      {/* อันแรห เต็มหน้าจอ - เพิ่ม pt-20 เพื่อชดเชย Navbar Spacer และปรับโทนสี */}
      <section className="min-h-screen flex flex-col justify-end pt-20 pb-32 px-8">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-800 via-amber-700 to-stone-700 bg-clip-text text-transparent">
              ค้นหาอสังหาริมทรัพย์
            </h1>
            <p className="text-xl text-stone-700 max-w-2xl mx-auto">
              text
            </p>
          </div>
        </div>
        <div className="w-full">
          <AISearch />
        </div>
      </section>

      {/* Boxsearch - ปรับโทนสี */}
      <section className="bg-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[#956748] mb-8 text-center">
            ค้นหาแบบละเอียด
          </h2>
          <Boxsearch />
        </div>
      </section>

      {/* แนะนำบ้าน - ปรับโทนสี */}
      <section className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-stone-800 mb-4">
              ทรัพย์สินแนะนำ
            </h2>
            <p className="text-xl text-stone-600">
              คัดสรรทรัพย์สินที่น่าสนใจสำหรับคุณ
            </p>
          </div>
          
          {/* Property Cards จะอยู่ที่นี่ */}
          <div className="space-y-6 ">
           <Propertycard />
          </div>

        </div>
      </section>
    </div>
  )
}

export default Tester