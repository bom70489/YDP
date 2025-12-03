import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Navbar from "../components/navbar";

interface FAQItem {
  question: string;
  answer: string;
}

const faqList: FAQItem[] = [
  {
    question: "ดอกเบี้ยบ้านคิดอย่างไร",
    answer:
      "ดอกเบี้ยบ้านขึ้นอยู่กับประเภทผลิตภัณฑ์ของสินเชื่อ เงื่อนไขรายได้ ผู้กู้ร่วม ระยะเวลากู้ และโปรโมชั่นของสถาบันการเงินในช่วงเวลานั้น ๆ",
  },
  {
    question: "ใช้เอกสารอะไรบ้างในการยื่นกู้ซื้อบ้าน",
    answer:
      "บัตรประชาชน สำเนาทะเบียนบ้าน เอกสารรับรองรายได้ สลิปเงินเดือน statement 6 เดือน เอกสารทรัพย์สิน และเอกสารเพิ่มเติมตามธนาคารกำหนด",
  },
  {
    question: "สามารถเลิกสัญญาก่อนกำหนดได้หรือไม่",
    answer:
      "ขึ้นอยู่กับเงื่อนไขสัญญา โดยส่วนมากอาจมีค่าปรับกรณีปิดบัญชีก่อนกำหนด หรือมีข้อจำกัดขึ้นกับประเภทสัญญา",
  },
  {
    question: "ค่าใช้จ่ายวันโอนมีอะไรบ้าง",
    answer:
      "ค่าธรรมเนียมโอน ภาษีธุรกิจเฉพาะ อากรแสตมป์ ค่าจดจำนอง ค่านิติบุคคล ค่าใช้จ่ายผู้ขาย-ผู้ซื้อแล้วแต่ตกลงกัน",
  },
  {
    question: "รายได้ขั้นต่ำในการกู้บ้าน",
    answer:
      "โดยทั่วไปเริ่มต้นประมาณ 15,000 บาทขึ้นไป และขึ้นอยู่กับเงื่อนไขของสถาบันการเงิน",
  },
  {
    question: "ค่างวดต้องชำระล่วงหน้าที่เดือนแรกหรือไม่",
    answer:
      "ส่วนใหญ่ต้องชำระค่างวดเดือนแรกเมื่อทำสัญญา แต่บางสถาบันการเงินมีโปรโมชั่นผ่อนงวดแรกช้ากว่าปกติ",
  },
];

export default function Questionspage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#F6E5D6] via-[#FFF5EA] to-[#F6E5D6] py-20 px-6 md:px-12">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-5xl"></span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#3d2b1f] mb-4">
            คำถามที่พบบ่อย
          </h2>
          <p className="text-[#6B5A4A] text-lg">
            
          </p>
        </div>

        <div className="space-y-4">
          {faqList.map((item, index) => (
            <div
              key={index}
              className="group bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl rounded-3xl p-6 border-2 border-[#e5d5c5] hover:border-[#D4A574] transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Q */}
              <button
                className="w-full flex justify-between items-center gap-4"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="flex items-center gap-4 text-[#3c2f2f] font-semibold text-left">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F3DCC9] to-[#E8C9A8] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-2xl text-amber-900">Q</span>
                  </div>
                  <span className="text-base md:text-lg">{item.question}</span>
                </div>

                <ChevronDown
                  className={`transition-all duration-300 text-amber-900 flex-shrink-0 ${
                    openIndex === index ? "rotate-180" : ""
                  } group-hover:scale-110`}
                  size={24}
                />
              </button>

              {/* Answer */}
              {openIndex === index && (
                <div className="mt-6 pl-16 pr-4">
                  <div className="bg-gradient-to-r from-[#FFF9F0] to-white p-5 rounded-2xl border-l-4 border-[#D4A574]">
                    <p className="text-[#4e3d3d] leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        
      </div>
    </section>
  );
}