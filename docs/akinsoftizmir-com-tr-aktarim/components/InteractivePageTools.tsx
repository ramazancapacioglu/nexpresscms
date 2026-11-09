'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calculator,
  CheckCircle2,
  Send,
  ShieldCheck,
  Search,
  KeyRound,
  HelpCircle,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

export function KdvCalculatorWidget() {
  const [amount, setAmount] = useState<string>('1000');
  const [calcType, setCalcType] = useState<'haric' | 'dahil'>('haric');
  const [vatRate, setVatRate] = useState<number>(20);
  const [withholding, setWithholding] = useState<number>(0); // e.g., 0, 2, 3, 4, 5, 7, 9 out of 10

  const numAmount = parseFloat(amount) || 0;
  let netAmount = 0;
  let vatAmount = 0;
  let totalWithVat = 0;

  if (calcType === 'haric') {
    netAmount = numAmount;
    vatAmount = netAmount * (vatRate / 100);
    totalWithVat = netAmount + vatAmount;
  } else {
    totalWithVat = numAmount;
    netAmount = totalWithVat / (1 + vatRate / 100);
    vatAmount = totalWithVat - netAmount;
  }

  const withholdingAmount =
    withholding > 0 ? vatAmount * (withholding / 10) : 0;
  const grandTotal = totalWithVat - withholdingAmount;

  const fmt = (val: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(val);

  return (
    <div className="bg-white border border-[#0c644e]/30 rounded-2xl p-6 sm:p-8 shadow-sm my-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-11 h-11 rounded-xl bg-[#0c644e]/10 text-[#0c644e] flex items-center justify-center">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#060a0d] m-0">
            KDV ve Tevkifat Hesaplama Aracı
          </h2>
          <p className="text-xs text-slate-500 m-0">
            Akınsoft İzmir Ana Bayi Pratik Muhasebe Hesaplayıcı
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#060a0d] mb-1.5">
              Tutar (TL)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-base font-semibold text-[#060a0d] focus:outline-none focus:border-[#09589a] tabular-nums"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#060a0d] mb-1.5">
              Hesaplama Türü
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setCalcType('haric')}
                className={`py-2 px-3 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                  calcType === 'haric'
                    ? 'bg-white text-[#0c644e] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                KDV Hariçten Hesapla
              </button>
              <button
                type="button"
                onClick={() => setCalcType('dahil')}
                className={`py-2 px-3 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                  calcType === 'dahil'
                    ? 'bg-white text-[#0c644e] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                KDV Dahilden Hesapla
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#060a0d] mb-1.5">
              KDV Oranı (%)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 10, 20].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setVatRate(rate)}
                  className={`py-2.5 rounded-lg font-bold text-sm border transition-colors cursor-pointer tabular-nums ${
                    vatRate === rate
                      ? 'bg-[#09589a] text-white border-[#09589a]'
                      : 'bg-white text-[#1a202c] border-slate-200 hover:border-[#09589a]'
                  }`}
                >
                  %{rate}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#060a0d] mb-1.5">
              Tevkifat Oranı (İsteğe Bağlı)
            </label>
            <select
              value={withholding}
              onChange={(e) => setWithholding(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-[#060a0d] bg-white focus:outline-none focus:border-[#09589a]"
            >
              <option value={0}>Tevkifat Yok</option>
              <option value={2}>2/10 Tevkifat</option>
              <option value={3}>3/10 Tevkifat</option>
              <option value={4}>4/10 Tevkifat</option>
              <option value={5}>5/10 Tevkifat</option>
              <option value={7}>7/10 Tevkifat</option>
              <option value={9}>9/10 Tevkifat</option>
            </select>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-[#f8fffe] border border-[#0c644e]/25 rounded-xl p-6 space-y-3.5 tabular-nums">
          <h3 className="text-base font-bold text-[#0c644e] uppercase tracking-wider m-0 pb-2 border-b border-emerald-900/10">
            Hesaplama Sonucu
          </h3>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">KDV Hariç Net Tutar:</span>
            <span className="font-bold text-[#060a0d] text-base">
              {fmt(netAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">KDV Tutarı (%{vatRate}):</span>
            <span className="font-bold text-[#09589a] text-base">
              {fmt(vatAmount)}
            </span>
          </div>

          {withholding > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Tevkifat Tutarı ({withholding}/10):
              </span>
              <span className="font-bold text-amber-700 text-base">
                -{fmt(withholdingAmount)}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-emerald-900/15 flex items-center justify-between">
            <span className="font-bold text-[#060a0d]">
              {withholding > 0
                ? 'Tevkifat Dahil Ödenecek Toplam:'
                : 'KDV Dahil Genel Toplam:'}
            </span>
            <span className="font-extrabold text-xl text-[#0c644e]">
              {fmt(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InteractiveLeadFormWidget({
  mode = 'demo',
}: {
  mode?: 'demo' | 'destek' | 'iletisim' | 'lisans';
}) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('Wolvox ERP');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const titles = {
    demo: {
      heading: '30 Günlük Ücretsiz Akınsoft Demo Talebi (Bayi Kodu: BA35022)',
      sub: 'İzmir içi yerinde veya Türkiye geneli uzaktan bağlantı ile ücretsiz demo kurulumunuzu hemen yapalım.',
      btn: 'Ücretsiz Demo Talep Et',
    },
    destek: {
      heading: 'Akınsoft Teknik Destek ve Servis Talebi',
      sub: '200+ aktif müşterimize ortalama 4 iş saati içinde telefon, WhatsApp veya uzak masaüstü ile destek sağlıyoruz.',
      btn: 'Destek Kaydı Oluştur',
    },
    iletisim: {
      heading: 'Hızlı İletişim ve Teklif Formu',
      sub: 'Yazılım fiyatları, kampanya koşulları veya kurumsal projeleriniz için uzman ekibimiz sizi arasın.',
      btn: 'Mesajı Gönder',
    },
    lisans: {
      heading: 'Online Lisans Kontrol ve Lisans Kayıt Formu',
      sub: 'Mevcut Akınsoft lisansınızı sorgulamak, kullanıcı/modül eklemek veya yıllık bakım yenilemek için bilgilerinizi iletin.',
      btn: 'Lisans Sorgula / Kayıt Oluştur',
    },
  }[mode];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-[#f8fffe] border border-[#0c644e]/30 rounded-2xl p-6 sm:p-8 shadow-sm my-8">
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-[#060a0d] mb-1.5">
          {titles.heading}
        </h3>
        <p className="text-sm sm:text-base text-[#252424] m-0">{titles.sub}</p>
      </div>

      {submitted ? (
        <div className="bg-white rounded-xl p-6 border border-[#0c644e]/30 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-[#0c644e] mx-auto" />
          <h4 className="text-lg font-bold text-[#060a0d] m-0">
            Talebiniz Başarıyla Alındı!
          </h4>
          <p className="text-sm text-[#252424] max-w-lg mx-auto">
            Sayın <strong>{name}</strong>, talebiniz Akınsoft İzmir Ana Bayi
            (BA35022) teknik ekibimize iletilmiştir. En kısa sürede{' '}
            <strong>{phone}</strong> numarasından sizinle iletişime geçeceğiz.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="px-5 py-2 bg-[#0c644e] text-white text-sm font-semibold rounded-lg hover:bg-[#09589a] transition-colors cursor-pointer"
          >
            Yeni Talep Gönder
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-bold text-[#060a0d] mb-1">
              Ad Soyad *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız ve Soyadınız"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#060a0d] focus:outline-none focus:border-[#09589a]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#060a0d] mb-1">
              Firma Unvanı
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Şirket / İşletme Adı"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#060a0d] focus:outline-none focus:border-[#09589a]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#060a0d] mb-1">
              Telefon Numarası *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0 (5XX) XXX XX XX"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#060a0d] focus:outline-none focus:border-[#09589a] tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#060a0d] mb-1">
              E-Posta Adresi *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@firma.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#060a0d] focus:outline-none focus:border-[#09589a]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#060a0d] mb-1">
              İlgilendiğiniz Akınsoft Çözümü
            </label>
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#060a0d] focus:outline-none focus:border-[#09589a]"
            >
              <option value="Wolvox ERP">Wolvox ERP (Kurumsal Kaynak Planlama)</option>
              <option value="Wolvox Ön Muhasebe / Genel Muhasebe">
                Wolvox Ön Muhasebe / Genel Muhasebe
              </option>
              <option value="OctoCloud Bulut Muhasebe">
                OctoCloud Bulut Muhasebe
              </option>
              <option value="Wolvox Restoran (Adisyon) Programı">
                Wolvox Restoran (Adisyon) Programı
              </option>
              <option value="Wolvox Hızlı Satış / Süper Market">
                Wolvox Hızlı Satış / Süper Market
              </option>
              <option value="E-Dönüşüm (e-Fatura, e-Arşiv, e-Defter, e-İrsaliye)">
                E-Dönüşüm (e-Fatura, e-Arşiv, e-Defter, e-İrsaliye)
              </option>
              <option value="Sektörel Çözümler (Otel, Servis, Sürücü Kursu, Mobil Satış)">
                Sektörel Çözümler (Otel, Servis, Sürücü Kursu, Mobil Satış)
              </option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#060a0d] mb-1">
              Notunuz veya Talebiniz
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="İşletmenizin ihtiyacı, kullanıcı sayısı veya sormak istediğiniz detayları yazabilirsiniz..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#060a0d] focus:outline-none focus:border-[#09589a]"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-500">
              Resmi Akınsoft İzmir Ana Bayi Kodu: <strong>BA35022</strong> ·{' '}
              <Link
                href="/gizlilik-politikasi/"
                className="text-[#09589a] underline"
              >
                Gizlilik Politikası
              </Link>
            </span>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0c644e] hover:bg-[#0f4c81] text-white font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{titles.btn}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
