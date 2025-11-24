import { useContext, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { SearchContext } from '../context/AppContext';

const AISearch = () => {

  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const context = useContext(SearchContext)

  if(!context) return null;
  const { search } = context

  const handleSearch = () => {
    if (searchText.trim()) search(searchText)
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      <div className="relative group">

        {/* Glow รอบนอก (ทองแดงนุ่ม) */}
        <div className="
          absolute -inset-1 rounded-full blur-xl opacity-0 
          group-hover:opacity-70 transition duration-500
          bg-gradient-to-r from-[#c8b8b1] via-[#d7a77a] to-[#b58363]
        "></div>

        {/* Main Search Bar */}
        <div
          className={`
            relative rounded-full shadow-xl bg-[#f9f7f5]
            transition-all duration-300
            ${isFocused ? 'scale-[1.02]' : ''}
            group-hover:shadow-[#c8b8b1]/50
          `}
        >
          <div className="flex items-center px-6 py-4 gap-4">

            {/* AI Icon กลมสีทองแดง */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br
              from-[#764b30] via-[#c8b8b1] to-[#a0662f]
              flex items-center justify-center shadow-md"
            >
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5}/>
            </div>

            {/* Input */}
            <input
              type="text"
              value={searchText}
              onKeyDown={(e) => {if (e.key === 'Enter') handleSearch()}}
              onChange={(e)=> setSearchText(e.target.value)}
              onFocus={()=> setIsFocused(true)}
              onBlur={()=> setIsFocused(false)}
              placeholder="บ้านเดี่ยว กว้างๆ ไม่เกิน 5 ล้าน"
              className="flex-1 text-lg text-[#7a4f35] placeholder-[#b49a8d] 
                bg-transparent outline-none font-light"
            />

            {/* Search Button */}
            <button
             onClick={handleSearch}
             className="
              group relative flex-shrink-0 px-5 py-3 rounded-full shadow-md
              bg-gradient-to-r from-[#b58363] via-[#d7a77a] to-[#c8b8b1]
              hover:from-[#8e5d44] hover:via-[#b58363] hover:to-[#d7a77a]
              transition-all duration-300 hover:scale-105 hover:shadow-lg
            ">

              {/* Shimmer effect */}
              <div className="
                absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 
                transition-opacity duration-300
              ">
                <div className="
                  absolute inset-0 rounded-full 
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  animate-shimmer
                "></div>
              </div>

              <div className="relative flex items-center gap-1">
                <Search className="w-7 h-7 text-white" strokeWidth={2.3}/>
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(50%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default AISearch;
