const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b border-snap-border bg-snap-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-snap-yellow flex items-center justify-center">
            <span className="text-snap-ink text-xs font-bold">S</span>
          </div>
          <span className="font-semibold text-snap-ink tracking-tight">SnapRules</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;