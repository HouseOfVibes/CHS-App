function Footer() {
  return (
    <footer className="bg-gradient-to-r from-chs-deep-navy via-chs-water-blue to-chs-teal-green py-6 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/90 text-sm">
          <div className="flex items-center gap-2">
            <span>Built by</span>
            <a
              href="https://mwdesign.agency"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:text-chs-bright-green transition-colors"
            >
              MW Design Studio
            </a>
            <span>© 2025</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
              Version 1.0
            </span>
            <a
              href="https://mwdesign.agency"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors text-xs"
            >
              mwdesign.agency
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
