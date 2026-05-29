export default function Sidebar() {
  return (
    <aside className="w-64 h-screen border-r border-zinc-800 bg-zinc-900 p-6">
      
      <h2 className="text-2xl font-bold mb-10">
        Wardrobe
      </h2>

      <nav className="flex flex-col gap-4 text-zinc-300">

        <button className="text-left hover:text-white transition">
          Dashboard
        </button>

        <button className="text-left hover:text-white transition">
          Mi Ropa
        </button>

        <button className="text-left hover:text-white transition">
          Outfits
        </button>

        <button className="text-left hover:text-white transition">
          IA Stylist
        </button>

        <button className="text-left hover:text-white transition">
          Favoritos
        </button>

      </nav>
    </aside>
  );
}