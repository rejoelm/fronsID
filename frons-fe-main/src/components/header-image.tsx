import React from "react";
import Image from "next/image";

export default function HeaderImage() {
  return (
    <div className="w-full h-[120px] relative overflow-hidden mb-12">
      <Image
        src="/header-pic.svg"
        alt="Fronsciers"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}
