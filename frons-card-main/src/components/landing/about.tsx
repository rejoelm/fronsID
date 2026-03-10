"use client";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const paragraphRefs = useRef<HTMLParagraphElement[]>([]);
  const lineRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
          },
        }
      );

      itemRefs.current.forEach((item, index) => {
        if (item) {
          gsap.fromTo(
            item,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: item,
                start: "top 85%",
              },
              delay: index * 0.2,
            }
          );
        }
      });

      paragraphRefs.current.forEach((paragraph, index) => {
        if (paragraph) {
          gsap.fromTo(
            paragraph,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: paragraph.closest(".faq-item"),
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse",
              },
              delay: index * 0.2,
            }
          );
        }
      });

      lineRefs.current.forEach((line, index) => {
        if (line) {
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              duration: 0.6,
              ease: "power2.out",
              transformOrigin: "top",
              scrollTrigger: {
                trigger: line,
                start: "top 85%",
                end: "bottom 15%",
                toggleActions: "play none none reverse",
              },
              delay: index * 0.15,
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <Separator />
      {/* Desktop About Section */}
      <section
        ref={sectionRef}
        className="hidden md:block bg-neutral-100 py-16"
      >
        <div className="mx-auto max-w-4xl px-8 flex flex-grid grid-cols-2 gap-24 items-start justify-between">
          <div ref={headerRef} className="flex items-center gap-3 mb-16">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <h2 className="text-gray-600 text-lg font-medium">
              Kenapa Harus Punya?
            </h2>
          </div>

          <div className="space-y-12">
            <div className="faq-item flex items-start gap-8">
              <span className="text-[#16007E] text-xl font-bold">(01)</span>
              <div className="flex-1">
                <h3 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  Sharing Menjadi Mudah
                </h3>
                <div className="overflow-hidden">
                  <p
                    ref={(el) => {
                      if (el) paragraphRefs.current[0] = el;
                    }}
                    className="text-lg text-gray-600 leading-relaxed max-w-2xl"
                  >
                    Ga perlu ribet ketik link panjang lagi. Tinggal ketuk, semua
                    info langsung kebuka.
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={(el) => {
                if (el) lineRefs.current[0] = el;
              }}
              className="h-px bg-gray-300"
            ></div>

            <div className="faq-item flex items-start gap-8">
              <span className="text-[#16007E] text-xl font-bold">(02)</span>
              <div className="flex-1">
                <h3 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  Kesan Profesional
                </h3>
                <div className="overflow-hidden">
                  <p
                    ref={(el) => {
                      if (el) paragraphRefs.current[1] = el;
                    }}
                    className="text-lg text-gray-600 leading-relaxed max-w-2xl"
                  >
                    Bikin kesan wow dengan kartu modern khusus dunia akademik.
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={(el) => {
                if (el) lineRefs.current[1] = el;
              }}
              className="h-px bg-gray-300"
            ></div>

            <div className="faq-item flex items-start gap-8">
              <span className="text-[#16007E] text-xl font-bold">(03)</span>
              <div className="flex-1">
                <h3 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Selalu Update
                </h3>
                <div className="overflow-hidden">
                  <p
                    ref={(el) => {
                      if (el) paragraphRefs.current[2] = el;
                    }}
                    className="text-lg text-gray-600 leading-relaxed max-w-2xl"
                  >
                    Info profil bisa diupdate kapan saja — kartunya ga pernah
                    kedaluwarsa.
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={(el) => {
                if (el) lineRefs.current[2] = el;
              }}
              className="h-px bg-gray-300"
            ></div>

            <div className="faq-item flex items-start gap-8">
              <span className="text-[#16007E] text-xl font-bold">(04)</span>
              <div className="flex-1">
                <h3 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Cocok Untuk Akademisi
                </h3>
                <div className="overflow-hidden">
                  <p
                    ref={(el) => {
                      if (el) paragraphRefs.current[3] = el;
                    }}
                    className="text-lg text-gray-600 leading-relaxed max-w-2xl"
                  >
                    Cocok banget buat mahasiswa, peneliti, dosen, dan semua yang
                    berkecimpung di dunia pendidikan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile About Section */}
      <section className="md:hidden bg-neutral-100 py-16">
        <div className="mx-auto max-w-lg px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <h2 className="text-gray-600 text-lg font-medium">
                Kenapa Harus Punya?
              </h2>
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center">
              <span className="text-[#16007E] text-lg font-bold mb-4 block">
                (01)
              </span>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                Seamless Sharing
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                No more typing long links, one tap is enough.
              </p>
            </div>

            <div className="h-px bg-gray-300"></div>

            <div className="text-center">
              <span className="text-[#16007E] text-lg font-bold mb-4 block">
                (02)
              </span>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                Professional Image
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Stand out with a modern, academic-focused identity card.
              </p>
            </div>

            <div className="h-px bg-gray-300"></div>

            <div className="text-center">
              <span className="text-[#16007E] text-lg font-bold mb-4 block">
                (03)
              </span>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                Update Every 5 Years
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Info profil bisa diupdate kapan saja — kartunya ga pernah
                kedaluwarsa.
              </p>
            </div>

            <div className="h-px bg-gray-300"></div>

            <div className="text-center">
              <span className="text-[#16007E] text-lg font-bold mb-4 block">
                (04)
              </span>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                Made for Academia
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Cocok banget buat mahasiswa, peneliti, dosen, dan semua yang
                berkecimpung di dunia pendidikan.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
