import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Building2, Send, MessageSquare } from 'lucide-react';
import Navbar from '../components/navbar';

                interface FormDataType {
                  name: string;
                  email: string;
                  phone: string;
                  subject: string;
                  message: string;
                }

                export default function ContactPage() {
                  const [formData, setFormData] = useState<FormDataType>({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: ''
                  });

                  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                    setFormData({
                      ...formData,
                      [e.target.name]: e.target.value
                    });
                  };

                  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    console.log('Form submitted:', formData);
                    alert('ขอบคุณที่ติดต่อเรา เราจะติดต่อกลับโดยเร็วที่สุด');
                  };

                  return (
                    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
                      <Navbar />
                      <div className="relative bg-gradient-to-br from-[#c7a496] via-[#b89585] to-[#a87f6f] text-white py-24 overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                        </div>

                        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
                          <h1 className="text-5xl font-bold mb-4">ติดต่อเรา</h1>
                          <p className="text-xl text-amber-50 max-w-2xl mx-auto">
                            เรายินดีให้คำปรึกษาและตอบคำถามทุกข้อสงสัยของคุณ
                          </p>
                        </div>
                      </div>

                      <div className="max-w-7xl mx-auto px-6 py-16">
                        <div className="grid lg:grid-cols-3 gap-8 mb-16">
                          {/* Contact Info Cards */}
                          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                            <div className="bg-gradient-to-br from-[#c7a496] to-[#b89585] rounded-full w-16 h-16 flex items-center justify-center mb-6">
                              <Phone className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-[#8b6f5e] mb-4">โทรศัพท์</h3>
                            <div className="space-y-2 text-gray-600">
                              <p className="flex items-center gap-2">
                                <span className="font-semibold">Call Center:</span>
                                <a href="tel:1443" className="text-[#c7a496] hover:underline">1443</a>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className="font-semibold">สำนักงานใหญ่:</span>
                                <a href="tel:026861800" className="text-[#c7a496] hover:underline">02-686-1800</a>
                              </p>
                              <p className="text-sm text-gray-500 mt-2">
                                02-620-8999, 02-610-2222
                              </p>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                            <div className="bg-gradient-to-br from-[#c7a496] to-[#b89585] rounded-full w-16 h-16 flex items-center justify-center mb-6">
                              <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-[#8b6f5e] mb-4">อีเมล</h3>
                            <div className="space-y-2 text-gray-600">
                              <p>
                                <a href="mailto:info@sam.or.th" className="text-[#c7a496] hover:underline">
                                  info@sam.or.th
                                </a>
                              </p>
                              <p className="text-sm text-gray-500 mt-4">
                                ส่งอีเมลสอบถามข้อมูลหรือขอคำปรึกษา
                              </p>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                            <div className="bg-gradient-to-br from-[#c7a496] to-[#b89585] rounded-full w-16 h-16 flex items-center justify-center mb-6">
                              <Clock className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-[#8b6f5e] mb-4">เวลาทำการ</h3>
                            <div className="space-y-2 text-gray-600">
                              <p className="font-semibold">จันทร์ - ศุกร์</p>
                              <p>08:30 - 17:00 น.</p>
                              <p className="text-sm text-gray-500 mt-2">
                                (เว้นวันหยุดราชการ)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid lg:grid-cols-2 gap-12 mb-16">
                          {/* Contact Form */}
                          <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-8">
                              <MessageSquare className="w-6 h-6 text-[#c7a496]" />
                              <h2 className="text-3xl font-bold text-[#8b6f5e]">ส่งข้อความถึงเรา</h2>
                            </div>

                            <div className="space-y-12">
                              <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#c7a496] focus:outline-none transition-colors"
                                  placeholder="กรุณากรอกชื่อของคุณ"
                                />
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-gray-700 font-medium mb-2">
                                    อีเมล <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#c7a496] focus:outline-none transition-colors"
                                    placeholder="your@email.com"
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-700 font-medium mb-2">
                                    เบอร์โทรศัพท์
                                  </label>
                                  <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#c7a496] focus:outline-none transition-colors"
                                    placeholder="0812345678"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                  หัวข้อ <span className="text-red-500">*</span>
                                </label>
                                <select
                                  name="subject"
                                  value={formData.subject}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#c7a496] focus:outline-none transition-colors"
                                >
                                  <option value="">เลือกหัวข้อที่ต้องการติดต่อ</option>
                                  <option value="debt">ปรับโครงสร้างหนี้</option>
                                  <option value="clinic">คลินิกแก้หนี้</option>
                                  <option value="property">ซื้อทรัพย์สิน NPA</option>
                                  <option value="general">สอบถามข้อมูลทั่วไป</option>
                                  <option value="other">อื่นๆ</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                  ข้อความ <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  name="message"
                                  value={formData.message}
                                  onChange={handleChange}
                                  rows={5}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#c7a496] focus:outline-none transition-colors resize-none"
                                  placeholder="กรุณาระบุรายละเอียดที่ต้องการติดต่อ..."
                                />
                              </div>

                              <button
                                onClick={handleSubmit}
                                className="w-full bg-gradient-to-r from-[#c7a496] to-[#b89585] hover:from-[#b89585] hover:to-[#a87f6f] text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                              >
                                <span>ส่งข้อความ</span>
                                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          </div>

                          {/* Office Location */}
                          <div>
                            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                              <div className="flex items-center gap-3 mb-6">
                                <Building2 className="w-6 h-6 text-[#c7a496]" />
                                <h2 className="text-3xl font-bold text-[#8b6f5e]">สำนักงานใหญ่</h2>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                  <MapPin className="w-6 h-6 text-[#c7a496] mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="text-gray-700 leading-relaxed">
                                      <strong>บริษัท บริหารสินทรัพย์สุขุมวิท จำกัด</strong><br />
                                      123 อาคารซันทาวเวอร์ส เอ ชั้น 27-30<br />
                                      ถนนวิภาวดีรังสิต แขวงจอมพล<br />
                                      เขตจตุจักร กรุงเทพฯ 10900
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Map Placeholder */}
                              <div className="rounded-lg overflow-hidden shadow-xl border-4 border-white/50 ">
                                
                                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d327.4166122477007!2d100.55850966797064!3d13.808298357715108!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29db5e602c041%3A0x2eba4e6790060328!2zU0FNIOC4muC4o-C4tOC4qeC4seC4lyDguJrguKPguLTguKvguLLguKPguKrguLTguJnguJfguKPguLHguJ7guKLguYzguKrguLjguILguLjguKHguKfguLTguJcg4LiI4Liz4LiB4Lix4LiUICjguKrguJnguI0uKQ!5e0!3m2!1sth!2sth!4v1764743764635!5m2!1sth!2sth" 
                                  width="100%" 
                                  height="350" 
                                  style={{border:0}} 
                                  allowFullScreen={true}
                                  loading="lazy" 
                                  referrerPolicy="no-referrer-when-downgrade" 
                                  ></iframe>
                                
                              </div>
                            </div>

                            {/* Branch Offices */}
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                              <h3 className="text-2xl font-bold text-[#8b6f5e] mb-6">สาขาของเรา</h3>

                              <div className="space-y-4">
                                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                                  <MapPin className="w-5 h-5 text-[#c7a496] mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold text-gray-700">สาขาเชียงใหม่</p>
                                    <p className="text-sm text-gray-500">ภาคเหนือ</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                                  <MapPin className="w-5 h-5 text-[#c7a496] mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold text-gray-700">สาขาขอนแก่น</p>
                                    <p className="text-sm text-gray-500">ภาคตะวันออกเฉียงเหนือ</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                                  <MapPin className="w-5 h-5 text-[#c7a496] mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold text-gray-700">สาขาสุราษฎร์ธานี</p>
                                    <p className="text-sm text-gray-500">ภาคใต้</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3">
                                  <MapPin className="w-5 h-5 text-[#c7a496] mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold text-gray-700">สาขาพิษณุโลก</p>
                                    <p className="text-sm text-gray-500">ภาคเหนือตอนล่าง</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Links Section */}
                        <div className="bg-gradient-to-br from-amber-50 to-transparent rounded-3xl p-12 text-center">
                          <h2 className="text-3xl font-bold text-[#8b6f5e] mb-6">ช่องทางติดต่ออื่นๆ</h2>
                          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                            นอกจากแบบฟอร์มด้านบน คุณยังสามารถติดต่อเราผ่านช่องทางต่างๆ ได้ดังนี้
                          </p>

                          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                              <Phone className="w-10 h-10 text-[#c7a496] mx-auto mb-3" />
                              <h3 className="font-bold text-[#8b6f5e] mb-2">โทรศัพท์</h3>
                              <p className="text-2xl font-bold text-[#c7a496]">1443</p>
                              <p className="text-sm text-gray-500 mt-1">Call Center</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                              <MessageSquare className="w-10 h-10 text-[#c7a496] mx-auto mb-3" />
                              <h3 className="font-bold text-[#8b6f5e] mb-2">SAM Smile App</h3>
                              <p className="text-sm text-gray-600">ติดตามข่าวสารและบริการ</p>
                              <p className="text-xs text-gray-500 mt-1">บนมือถือและแท็บเล็ต</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                              <Mail className="w-10 h-10 text-[#c7a496] mx-auto mb-3" />
                              <h3 className="font-bold text-[#8b6f5e] mb-2">อีเมล</h3>
                              <p className="text-sm text-gray-600 break-all">info@sam.or.th</p>
                              <p className="text-xs text-gray-500 mt-1">ตอบภายใน 24 ชั่วโมง</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }