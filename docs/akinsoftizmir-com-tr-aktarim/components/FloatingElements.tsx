'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ClipboardList, ArrowUp, CheckCircle2 } from 'lucide-react';

export default function FloatingElements() {
  const [modalOpen, setModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Lütfen zorunlu alanları doldurunuz.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    setSubmitted(true);
  };

  const resetModal = () => {
    setModalOpen(false);
    setSubmitted(false);
    setErrorMsg('');
  };

  return (
    <>
      {/* Fixed Bottom-Left WhatsApp Button (element-11086) */}
      <div className="fixed left-3 bottom-3 z-40">
        <a
          href="https://api.whatsapp.com/send/?phone=902324251988"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Whatsapp İletişim"
          title="Whatsapp"
          className="block hover:scale-105 transition-transform duration-150"
        >
          <Image
            src="/images/whatsapp-iletisim-02.webp"
            alt="Whatsapp İletişim"
            width={72}
            height={72}
            referrerPolicy="no-referrer"
            className="w-16 h-16 sm:w-[76px] sm:h-[76px] object-contain drop-shadow-md"
          />
        </a>
      </div>

      {/* Fixed Bottom-Right "Sizi arayalım!" Trigger Button (element-11062) */}
      <div className="hidden sm:block fixed right-3 bottom-[84px] z-40">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="bg-[#09589a] hover:bg-[#0f4c81] text-white font-semibold text-[18px] leading-6 px-3.5 py-3.5 rounded-[15px] border-2 border-[#0f4c81] hover:border-[#1159af] shadow-[0_0_20px_5px_rgba(37,36,36,0.35)] transition-colors cursor-pointer whitespace-nowrap"
        >
          Sizi arayalım!
        </button>
      </div>

      {/* Scroll To Top Button (#kt-scroll-up) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Başa Dön"
          className="fixed right-6 bottom-7 z-40 bg-[#0c644e] hover:bg-[#09589a] text-white p-2.5 shadow-md transition-colors cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* "Sizi Arayalım" Modal Dialog (#kt-modal11062_4ae51f-aa) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#252424]/50 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={resetModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hızlı İletişim Formu"
            className="bg-[#fafafa] w-full max-w-[460px] rounded-[10px] shadow-[0_0_14px_0_rgba(0,0,0,0.2)] p-6 relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={resetModal}
              aria-label="Kapat"
              className="absolute top-3.5 right-3.5 p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-[22px] font-bold text-[#060a0d] flex items-center justify-center gap-2 mb-5">
              <span>Sizi Arayalım</span>
              <ClipboardList className="w-5 h-5 text-[#09589a]" />
            </h3>

            {submitted ? (
              <div className="py-6 space-y-3 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#0c644e] mx-auto" />
                <h4 className="text-lg font-bold text-[#060a0d]">
                  Talebiniz Alındı!
                </h4>
                <p className="text-sm text-[#252424]">
                  Akınsoft İzmir Ana Bayi uzman ekibimiz en kısa sürede{' '}
                  <strong>{phone}</strong> numarasından sizinle iletişime
                  geçecektir.
                </p>
                <button
                  type="button"
                  onClick={resetModal}
                  className="mt-2 px-6 py-2.5 bg-[#0c644e] text-white font-semibold rounded-md hover:bg-[#09589a] transition-colors cursor-pointer"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                {errorMsg && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="bg-white border border-slate-300 rounded-md px-3 py-2 focus-within:border-[#09589a]">
                  <label className="block text-xs font-semibold text-slate-500">
                    Ad Soyad <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm text-[#060a0d] focus:outline-none pt-0.5"
                  />
                </div>

                <div className="bg-white border border-slate-300 rounded-md px-3 py-2 focus-within:border-[#09589a]">
                  <label className="block text-xs font-semibold text-slate-500">
                    E-posta <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm text-[#060a0d] focus:outline-none pt-0.5"
                  />
                </div>

                <div className="bg-white border border-slate-300 rounded-md px-3 py-2 focus-within:border-[#09589a]">
                  <label className="block text-xs font-semibold text-slate-500">
                    Telefon <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm text-[#060a0d] focus:outline-none pt-0.5 tabular-nums"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-[#252424] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="mt-0.5 accent-[#0c644e]"
                  />
                  <span>
                    <Link
                      href="/gizlilik-politikasi/"
                      onClick={() => setModalOpen(false)}
                      className="text-[#09589a] underline hover:text-[#0c644e]"
                    >
                      Açık rıza metni ve Gizlilik politikasını
                    </Link>{' '}
                    okudum onaylıyorum.
                  </span>
                </label>

                <div className="pt-2 text-center">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-[#0c644e] hover:bg-[#0f4c81] text-white font-semibold rounded-[4px] transition-colors cursor-pointer"
                  >
                    Gönder
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
