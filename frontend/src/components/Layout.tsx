import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/data-input', label: 'Data Input', icon: '⚡' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Brand Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-green-600 py-3 px-4">
        <div className="container mx-auto flex items-center justify-center sm:justify-start space-x-3">
          <span className="text-4xl drop-shadow-lg">⚡</span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              Volt Vision
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium tracking-widest uppercase">
              Hybrid Energy Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔋</span>
              <span className="text-slate-400 text-sm hidden sm:block">Solar + Wind + Battery Dashboard</span>
            </div>
            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="mr-1 sm:mr-2">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p className="font-semibold text-blue-400">⚡ Volt Vision</p>
          <p className="mt-1">Electrical Engineering Capstone Project - Hybrid Energy Management System</p>
          <p className="mt-1">© 2026 - Powered by FastAPI + React + TypeScript</p>
        </div>
      </footer>
    </div>
  );
}
