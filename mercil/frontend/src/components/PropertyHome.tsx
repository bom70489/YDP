import { Home, Building2, Hotel, Warehouse } from "lucide-react";

const PropertyHomePage = () => {
  const propertyTypes = [
    { icon: Home, label: "บ้านเดี่ยว" },
    { icon: Building2, label: "คอนโด" },
    { icon: Hotel, label: "ทาวน์เฮ้าส์" },
    { icon: Warehouse, label: "อาคารพาณิชย์" },
  ];
  return (
    <>
      <div className="w-full">
        {/* การ์ดเมนู */}
        <div className="border border-blue-400 grid grid-cols-4 gap-6 ">
          {propertyTypes.map((type, index) => (
            <button 
            key={index}
            className="group relative flex flex-col items-center justify-center p-6 rounded-xl 
            bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/20 
            transition-all duration-300 hover:scale-105"
          >
              <div
                className="w-24 h-24 rounded-lg 
            bg-gradient-to-br from-blue-500 to-cyan-500 
            flex items-center justify-center mb-4
            group-hover:from-blue-600 group-hover:to-cyan-600 
            transition-all duration-300 shadow-lg"
              >
                <type.icon className="w-12 h-12 text-white" />
              </div>

              <span className="text-gray-800 text-base font-medium">
                {type.label}
              </span>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-12 transition-all duration-300 rounded-full"></div>
            </button>
          ))}
        </div>
      
      </div>
    </>
  );
};

export default PropertyHomePage;
