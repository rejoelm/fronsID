"use client";
import { ArrowRight } from "lucide-react";
import { IoPersonAdd, IoCard, IoTime } from "react-icons/io5";

export default function HowItWorks() {
  return (
    <section className="bg-neutral-100">
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Gimana Cara Pesannya?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sangat mudah, hanya dengan 3 langkah!
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-16">
          <div className="flex flex-col items-center text-center max-w-xs">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6">
              <IoPersonAdd className="w-10 h-10 text-neutral-100" />
            </div>
            <div className="w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center mb-4 text-lg font-bold">
              1
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Daftar Akun
            </h3>
            <p className="text-gray-600">
              Bikin akun di fronsciers.com buat mulai setup profil akademik Anda
            </p>
          </div>

          {/* Arrow 1 */}
          <div className="hidden md:block">
            <ArrowRight className="w-8 h-8 text-neutral-900" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center max-w-xs">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6">
              <IoCard className="w-10 h-10 text-neutral-100" />
            </div>
            <div className="w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center mb-4 text-lg font-bold">
              2
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Pesan Kartunya
            </h3>
            <p className="text-gray-600">
              Order kartu NFC kamu cuma Rp225.000 saja, bayar langsung selesai
            </p>
          </div>

          {/* Arrow 2 */}
          <div className="hidden md:block">
            <ArrowRight className="w-8 h-8 text-neutral-900" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center max-w-xs">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6">
              <IoTime className="w-10 h-10 text-neutral-100" />
            </div>
            <div className="w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center mb-4 text-lg font-bold">
              3
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Tunggu Sampai
            </h3>
            <p className="text-gray-600">
              Kartu NFC Anda akan dikirim langsung ke rumah
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
