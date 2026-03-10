import ScrollVelocity from "@/components/ui/scrollvelocity";

export default function SEO() {
  return (
    <div className="bg-neutral-100 md:py-16 pb-16 pt-4 overflow-hidden">
      <ScrollVelocity
        texts={["Yuk Mulai Terhubung Sekarang"]}
        className="text-4xl font-semibold tracking-[-0.02em] drop-shadow md:text-[5rem] md:leading-[5rem]"
      />
    </div>
  );
}
