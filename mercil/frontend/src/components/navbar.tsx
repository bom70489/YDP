import { useState, useEffect, useContext } from "react";
import {
  Menu,
  X,
  Home,
  Info,
  Heart,
  Mail,
  User,
  MessageSquareQuote,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/UserContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const context = useContext(AuthContext);
  if (!context) return null;

  const { user, logout } = context;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <div className="h-20"></div>

      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        } ${
          isScrolled
            ? "bg-[#FFFCFC]/90 border backdrop-blur-xl shadow-md"
            : "bg-[#FFFCFC]/70 border-b backdrop-blur-xl"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 md:px-12">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#c7a496] flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-[#6a4d41]">Mercil</div>
            </div>

            {/* Desktop Menu */}
            <ul className="hidden md:flex items-center space-x-2 font-medium">
              {[
                { name: "หน้าหลัก", icon: Home, link: "/" },
                { name: "คำถามที่พบบ่อย", icon: MessageSquareQuote, link: "/question" },
                { name: "เกี่ยวกับ", icon: Info, link: "/about" },
                ...(user
                  ? [{ name: "รายการโปรด", icon: Heart, link: "/favorite" }]
                  : []),
                { name: "ติดต่อ", icon: Mail, link: "/contact" },
              ].map((item) => (
                <li key={item.name} className="group/item relative">
                  <a
                    href={item.link || "#"}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#583c2a] transition-all duration-150 group-hover/item:bg-[#e8dfda] group-hover/item:text-[#a16545]"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Login Button */}
            <div className="hidden md:block">
              {user ? (
                <div className="px-6 py-2.5 bg-white rounded-lg shadow-lg flex items-center gap-2 text-[#7a4f35] cursor-pointer hover:bg-[#f4efec] transition">
                  <User className="w-4 h-4" />
                  {user.name}
                  <button
                    onClick={logout}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to={"/login"}
                  className="px-6 py-2.5 bg-white rounded-lg shadow-lg flex items-center gap-2 text-[#7a4f35] hover:bg-[#f4efec] transition"
                >
                  <User className="w-4 h-4" />
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[#7a4f35]"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-[600px]" : "max-h-0"
          }`}
        >
          <div className="px-6 py-4 bg-white/90 backdrop-blur-md space-y-2">
            {[
              { name: "หน้าหลัก", icon: Home, link: "/" },
              { name: "คำถามที่พบบ่อย", icon: MessageSquareQuote, link: "/question" },
              { name: "เกี่ยวกับ", icon: Info, link: "/about" },
              ...(user
                ? [{ name: "รายการโปรด", icon: Heart, link: "/favorite" }]
                : []),
              { name: "ติดต่อ", icon: Mail, link: "/contact" },
            ].map((item) => (
              <a
                href={item.link || "#"}
                key={item.name}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#7a4f35] hover:bg-[#e8dfda]"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </a>
            ))}

            {user ? (
              <div className="px-6 py-2.5 bg-white rounded-lg shadow-lg flex items-center gap-2 text-[#7a4f35] cursor-pointer hover:bg-[#f4efec] transition">
                <User className="w-4 h-4" />
                {user.name}
                <button
                  onClick={logout}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="w-full px-6 py-2.5 bg-white rounded-lg shadow-lg flex items-center justify-center gap-2 text-[#7a4f35] hover:bg-[#f4efec] transition"
              >
                <User className="w-4 h-4" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;