"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = "Halo dari Website Fronsciers";
    const body = `Halo tim Fronsciers,\n\nAku tertarik nih sama platform kalian. Boleh dong ceritain lebih detail?\n\nThanks,\n${email}`;
    const mailtoLink = `mailto:fronsciers@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    setEmail("");
  };

  return (
    <footer className="bg-white md:pb-0">
      <div className="bg-primary rounded-t-3xl overflow-hidden mx-4 mb-8 md:mb-4">
        <div className="py-16 px-6 max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center">
              <Image
                src="/logowhite.svg"
                alt="Logo Fronsciers"
                width={40}
                height={40}
                className="rounded-md w-40 h-40"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl lg:text-3xl font-semibold text-white leading-tight ">
                Yuk mulai terhubung dengan dunia akademik!
              </h3>
              <p className="text-white/80 text-lg">
                Penasaran sama peer review pakai blockchain? Hubungi kami
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="email"
                    placeholder="Email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white border-0 text-gray-900 h-12"
                  />
                </div>
                <Button type="submit" variant="outline" className="h-12">
                  Kirim
                </Button>
              </div>
            </form>

            <div className="pt-8 mt-8 border-t border-white/20">
              <p className="text-white/70 text-xs">
                © 2025 Fronsciers. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
