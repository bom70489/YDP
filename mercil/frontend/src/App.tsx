import Navbar from './components/navbar.tsx' 
import AISearch from './components/AISearch.tsx' 
import Boxsearch from './components/Boxsearch.tsx' 
import Propertycard from './components/Propertycard.tsx' 
import Footer from './components/Footer.tsx'
import BackgroundSwitcher from './components/BackgroundPicture.tsx'

const App = () => {
  return (
    <div className='bg-gradient-to-br from-amber-50 via-white to-amber-50'>
     <Navbar />
      

      <BackgroundSwitcher>
        <section className="min-h-screen flex flex-col justify-end pt-20 pb-32 px-8">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6 ">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-800 via-amber-700 to-stone-700 bg-clip-text text-transparent"></h1>

              <p className="text-xl text-stone-700 max-w-2xl mx-auto"></p>
            </div>
          </div>

          <div className="w-full mt-20  my-16">
            <AISearch />
          </div>
        </section>
      </BackgroundSwitcher>

      {/* Boxsearch - ปรับโทนสี */}
      <section className=" py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[#956748] mb-8 text-center">
            ค้นหาแบบละเอียด
          </h2>
          <Boxsearch />
        </div>
      </section>

      {/* แนะนำบ้าน - ปรับโทนสี */}
      <section className="min-h-scree py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#956748] mb-4">
              ทรัพย์สินแนะนำ
            </h2>
            <p className="text-xl text-[#956748]">
              คัดสรรทรัพย์สินที่น่าสนใจสำหรับคุณ
            </p>
          </div>
          
          {/* Property Cards จะอยู่ที่นี่ */}
          <div className="space-y-6 ">
           <Propertycard />
          </div>

        </div>
      </section>
      <>
      <Footer/>
      </>
    </div>
  )
}

export default App