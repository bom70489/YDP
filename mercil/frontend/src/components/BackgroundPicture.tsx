import { useEffect, useState } from "react";

type BackgroundProps = {
  children: React.ReactNode;
};

const BackgroundSwitcher = ({ children }: BackgroundProps) => {
  const images = [
    "https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg",
    "https://images.pexels.com/photos/277667/pexels-photo-277667.jpeg",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 3) % images.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{
        backgroundImage: `url(${images[index]})`,
      }}
    >
      {/* Gradient Filter */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#261E11] to-transparent"></div>

      {/* Content on top */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BackgroundSwitcher;