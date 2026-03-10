import PillNav from "@/components/ui/pillnav";

export default function Navbar() {
  const Image = "/logowhite.svg";
  return (
    <header className="fixed top-0 w-full z-50 flex justify-center items-center">
      <div className="items-center">
        <PillNav
          logo={Image}
          logoAlt="logo"
          items={[
            { label: "Pesan Yuk", href: "https://www.fronsciers.com" },
          ]}
          activeHref="/"
          className="custom-nav"
          ease="power2.easeOut"
          baseColor="#0a0a0a"
          pillColor="#0a0a0a"
          hoveredPillTextColor="#f5f5f5"
          pillTextColor="#f5f5f5"
        />
      </div>
    </header>
  );
}
