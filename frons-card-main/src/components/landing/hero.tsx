"use client";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlurText from "@/components/ui/blurtext";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  return (
    <>
      {/* Desktop Hero Section */}
      <div className="hidden md:block min-h-screen bg-neutral-100 relative">
        <div className="absolute z-10 flex flex-col justify-center px-12 py-16 max-w-2xl h-full">
          <BlurText
            text="Satu Ketuk, Langsung Terhubung"
            delay={250}
            animateBy="words"
            direction="bottom"
            className="text-6xl md:text-7xl  font-semibold text-gray-900 mb-6 leading-tight"
          />
          {/* <h1 className="text-6xl md:text-7xl  font-bold text-gray-900 mb-6 leading-tight">
            Tap to <em className="italic font-light">Connect</em>
          </h1> */}

          <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-lg">
            Kartu NFC Fronsciers memudahkan berbagi profil akademik Anda.
            Cukup ketuk sekali, orang lain langsung bisa lihat profil lengkap Anda
            — tanpa ribet install aplikasi.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="https://www.fronsciers.com" target="_blank">
              <button className="bg-gray-900 text-white hover:bg-gray-800 font-medium px-8 py-3 rounded-xl transition-all duration-200">
                Pesan Sekarang
              </button>
            </Link>
            <Link
              href="https://www.fronsciers.com/submit-manuscript"
              target="_blank"
            >
              <button className="text-gray-900 border border-gray-300 hover:bg-gray-50 font-medium px-8 py-3 rounded-xl flex items-center transition-all duration-200">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Mulai Publikasi
              </button>
            </Link>
          </div>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-2/3 scale-110">
          <Image
            src="/shapedimage.png"
            alt="background"
            fill
            className="object-contain object-right"
          />
        </div>
      </div>

      <div className="md:hidden min-h-screen bg-neutral-100 relative flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center text-center px-8 py-16">
          <BlurText
            text="Satu Ketuk, Langsung Terhubung"
            delay={250}
            animateBy="words"
            direction="bottom"
            className="text-5xl font-semibold text-gray-900 mb-6 mt-16 leading-tight"
          />

          <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-md">
            Kartu NFC Fronsciers memudahkan berbagi profil akademik Anda.
            Cukup ketuk sekali, orang lain langsung bisa lihat profil lengkap Anda
            — tanpa ribet install aplikasi.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-sm mb-8">
            <Link href="https://www.fronsciers.com" target="_blank">
              <button className="w-full bg-gray-900 text-white hover:bg-gray-800 font-medium px-8 py-3 rounded-xl transition-all duration-200">
                Pesan Sekarang
              </button>
            </Link>
            <Link
              href="https://www.fronsciers.com/submit-manuscript"
              target="_blank"
            >
              <button className="w-full text-gray-900 border border-gray-300 hover:bg-gray-50 font-medium px-8 py-3 rounded-xl flex items-center justify-center transition-all duration-200">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Mulai Publikasi
              </button>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center pb-8 scale-125">
          <div className="w-full max-w-sm aspect-[3/4] relative">
            <Image
              src="/cardpicmobile.png"
              alt="Kartu NFC Fronsciers"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </>
  );
}
