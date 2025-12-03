import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Youtube,
  Building2,
  ExternalLink,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-[#8b6f5e] to-[#6d5647] text-white mt-16">
      <div className="max-w-7xl mx-auto px-2 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* ข้อมูลบริษัทและเมนู */}
          <div>
            <h2 className="text-3xl font-bold mb-6 text-amber-100">
              บริษัท บริหารสินทรัพย์สุขุมวิท จำกัด
            </h2>
            <p className="text-xl mb-8 text-amber-50">SAM</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-amber-300" />
                <p className="text-sm leading-relaxed">
                  สำนักงานใหญ่: 123 อาคารซันทาวเวอร์ส เอ ชั้น 27-30
                  ถนนวิภาวดีรังสิต
                  <br />
                  แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0 text-amber-300" />
                <p className="text-sm">
                  1443 หรือ 02-610-2277 • โทรสาร 0-2617-8228 / 0-2617-8232
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0 text-amber-300" />
                <a
                  href="mailto:Corp@sam.or.th"
                  className="text-sm hover:text-amber-200 transition-colors"
                >
                  Corp@sam.or.th
                </a>
              </div>
            </div>

            {/* เมนูและโซเชียล */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-amber-100">
                  เมนูลัด
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/"
                      className="text-sm hover:text-amber-200 transition-colors inline-block"
                    >
                      หน้าแรก
                    </a>
                  </li>
                  <li>
                    <a
                      href="/about"
                      className="text-sm hover:text-amber-200 transition-colors inline-block"
                    >
                      เกี่ยวกับเรา
                    </a>
                  </li>
                  <li>
                    <a
                      href="/properties"
                      className="text-sm hover:text-amber-200 transition-colors inline-block"
                    >
                      ทรัพย์สินรอการขาย
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      className="text-sm hover:text-amber-200 transition-colors inline-block"
                    >
                      ติดต่อเรา
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-amber-100">
                  ช่องทางติดตาม
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://www.facebook.com/SAMNPA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-amber-200 transition-colors inline-flex items-center gap-2"
                    >
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.line.me/ti/p/@samline"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-amber-200 transition-colors inline-block"
                    >
                      Line @samline
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.youtube.com/SAMNPAChannel"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-amber-200 transition-colors inline-flex items-center gap-2"
                    >
                      <Youtube className="w-4 h-4" />
                      YouTube
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* แผนที่ */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-amber-100">
              แผนที่ตั้งสำนักงาน
            </h3>
            <div className="rounded-lg overflow-hidden shadow-xl border-4 border-white/20">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d242.15689758153172!2d100.55884670466185!3d13.808364578732279!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29db5e602c041%3A0x2eba4e6790060328!2zU0FNIOC4muC4o-C4tOC4qeC4seC4lyDguJrguKPguLTguKvguLLguKPguKrguLTguJnguJfguKPguLHguJ7guKLguYzguKrguLjguILguLjguKHguKfguLTguJcg4LiI4Liz4LiB4Lix4LiUICjguKrguJnguI0uKQ!5e0!3m2!1sen!2sth!4v1764740965745!5m2!1sen!2sth"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="SAM Office Location"
              ></iframe>
            </div>
          </div>
        </div>

        {/* หน่วยงานที่เกี่ยวข้อง */}
        <div className="mb-12 pb-12 border-b border-white/20">
          <h3 className="font-semibold text-xl mb-6 text-amber-100 text-center">
            หน่วยงานที่เกี่ยวข้อง
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  {[
    {
      img: "/image/ธนาคารแห่งประเทศไทย.jpg",
      label: "ธนาคารแห่งประเทศไทย",
      link: "https://www.bot.or.th",
    },
    {
      img: "/image/กระทรวงการคลัง.png",
      label: "กระทรวงการคลัง",
      link: "https://www.fidf.or.th",
    },
    {
      img: "/image/กรมบังคับคดี.png",
      label: "กรมบังคับคดี",
      link: "https://www.set.or.th",
    },
    {
      img: "/image/สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ.png",
      label: "สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ",
      link: "https://www.pttplc.com",
    },
    {
      img: "/image/สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์.png",
      label: "สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์",
      link: "https://www.pttplc.com",
    },
    {
      img: "/image/บรรษัทตลาดรองสินเชื่อที่อยู่อาศัย.png",
      label: "บรรษัทตลาดรองสินเชื่อที่อยู่อาศัย",
      link: "https://www.pttplc.com",
    },
  ].map((item, index) => (
    <a
      key={index}
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-5 transition-all group text-center border border-white/20"
    >
      {/* กรอบรูปใหญ่ขึ้น */}
      <div className="bg-white rounded-lg p-4 border border-white/30">
        <img
          src={item.img}
          className="h-36 w-auto object-contain mx-auto"
          alt={item.label}
        />
      </div>

      <p className="text-xl text-amber-50 group-hover:text-white  transition-colors mt-3 leading-tight">
        {item.label}
      </p>

      <ExternalLink className="w-4 h-4 text-amber-300 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  ))}
</div>

        </div>

        {/* Copyright */}
        <div className="pt-6">
          <p className="text-center text-sm text-amber-100">
            © {new Date().getFullYear()} บริษัท บริหารสินทรัพย์สุขุมวิท จำกัด.
            สงวนลิขสิทธิ์ทุกประการ.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;