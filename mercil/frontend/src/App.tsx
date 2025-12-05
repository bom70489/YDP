import Navbar from './components/navbar' 
import AISearch from './components/AISearch' 
import Boxsearch from './components/Boxsearch' 
import Footer from './components/Footer'
import BackgroundSwitcher from './components/BackgroundPicture'
import SearchResultsSection from './components/Search'
import RecommendationsSection from './components/Recommendatios'

const App = () => {
  return (
    <div className='bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'>
      <Navbar />

      {/* Hero Section with AI Search */}
      <BackgroundSwitcher>
        <section className="min-h-screen flex flex-col justify-end pt-20 pb-32 px-8">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent leading-tight drop-shadow-sm">
                ค้นหาบ้านในฝัน
                <br />
                <span className="text-4xl md:text-5xl bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
                  ด้วย AI ที่เข้าใจคุณ
                </span>
              </h1>
              <p className="text-xl text-white max-w-2xl mx-auto leading-relaxed font-medium">
                ค้นหาทรัพย์สินที่ใช่สำหรับคุณ ด้วยเทคโนโลยี AI ที่ชาญฉลาด
              </p>
            </div>
          </div>

          <div className="w-full mt-20 my-16">
            <AISearch />
          </div>
        </section>
      </BackgroundSwitcher>

      {/* Advanced Search Section */}
      <section className="py-16 px-8 bg-gradient-to-b from-transparent to-orange-50/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-8 text-center">
            ค้นหาแบบละเอียด
          </h2>
          <Boxsearch />
        </div>
      </section>

      {/* Search Results Section - Shows when user searches */}
      <SearchResultsSection />

      {/* Recommendations Section - Always shows */}
      <RecommendationsSection />

      <Footer />
    </div>
  )
}

export default App