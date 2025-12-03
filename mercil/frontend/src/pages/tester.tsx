import BackgroundSwitcher from "../components/BackgroundPicture.tsx";
import Navbar from "../components/navbar.tsx";
import AISearch from "../components/AISearch.tsx";

const Tester = () => {
  return (
    <div>
      <Navbar />

      <BackgroundSwitcher>
        <section className="min-h-screen flex flex-col justify-end pt-20 pb-32 px-8">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-800 via-amber-700 to-stone-700 bg-clip-text text-transparent"></h1>

              <p className="text-xl text-stone-700 max-w-2xl mx-auto"></p>
            </div>
          </div>

          <div className="w-full">
            <AISearch />
          </div>
        </section>
      </BackgroundSwitcher>
    </div>
  );
};

export default Tester;