export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <h1 className="text-2xl font-bold">
          Digital Wardrobe
        </h1>

        <div className="flex gap-6 text-zinc-300">
          <button className="hover:text-white transition">
            Inicio
          </button>

          <button className="hover:text-white transition">
            Outfits
          </button>

          <button className="hover:text-white transition">
            Armario
          </button>
        </div>
      </div>
    </nav>
  );
}