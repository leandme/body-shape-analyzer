const SITE_NAME = "Body Shape Analyzer";
const LOGO_SRC = "/favicon.ico";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 px-2 sm:px-4 lg:sticky top-0 z-50 border-b border-base-200">
      <div className="navbar-start min-w-0">
        <a
          className="btn btn-ghost font-heading text-xl flex items-center gap-2 hover:bg-transparent focus:bg-transparent active:bg-transparent"
          href="/"
        >
          <img src={LOGO_SRC} alt="Body Shape Analyzer Logo" className="w-6 h-6" />
          {SITE_NAME}
        </a>
        <div className="hidden lg:flex ml-4 xl:ml-8">
          <ul className="menu menu-horizontal px-1 gap-2 xl:gap-4 text-base whitespace-nowrap flex-nowrap">
            <li>
              <a
                href="https://bodyvisualizer.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-normal hover:bg-transparent focus:bg-transparent active:bg-transparent"
              >
                Body Visualizer
              </a>
            </li>
            <li>
              <a
                href="https://skoy.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-normal hover:bg-transparent focus:bg-transparent active:bg-transparent"
              >
                AI Calorie Counter
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
