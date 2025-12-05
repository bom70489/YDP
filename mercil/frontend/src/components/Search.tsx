import { useContext } from 'react';
import { SearchContext } from '../context/AppContext';
import PropertyCard from './Propertycard';

const SearchResultsSection = () => {
  const context = useContext(SearchContext);
  
  if (!context) return null;
  
  const { searchResults, loading } = context;

  // Don't show anything if no search has been performed
  if (searchResults.length === 0 && !loading) {
    return null;
  }

  if (loading) {
    return (
      <section className="min-h-screen py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#956748] mb-4">
              ผลการค้นหา
            </h2>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#b58363] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#8e5d44] font-medium">กำลังค้นหา...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10 py-34 px-8 bg-gradient-to-b from-white to-amber-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#956748] mb-4">
            ผลการค้นหา
          </h2>
          <p className="text-xl text-[#956748]">
            พบ {searchResults.length} ทรัพย์สินที่ตรงกับที่คุณค้นหา
          </p>
        </div>
        
        <PropertyCard properties={searchResults} />
      </div>
    </section>
  );
};

export default SearchResultsSection;