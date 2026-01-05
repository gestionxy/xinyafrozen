
import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import SimpleOrderForm from './components/SimpleOrderForm';
import SimpleOrderAdmin from './components/SimpleOrderAdmin';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import HistoryDashboard from './components/HistoryDashboard';
import LandingPage from './components/LandingPage';
import { Package, ShieldCheck, History, LogOut, ClipboardList, Home, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.LANDING);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });

  // Simple Admin State
  const [isSimpleAdmin, setIsSimpleAdmin] = useState(false);
  const [simpleLoginForm, setSimpleLoginForm] = useState({ user: '', pass: '' });

  // History Edit State
  const [editingSession, setEditingSession] = useState<any>(null);

  // Mobile Nav State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'admin' && loginForm.pass === 'xinya-888') {
      setIsAdmin(true);
      setView(ViewMode.ADMIN);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleSimpleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (simpleLoginForm.user === 'admin' && simpleLoginForm.pass === 'xinya-888') {
      setIsSimpleAdmin(true);
    } else {
      alert('Invalid credentials');
    }
  };

  const NavButton = ({ targetView, icon: Icon, label }: { targetView: ViewMode, icon: any, label: string }) => (
    <button
      onClick={() => {
        setView(targetView);
        if (targetView !== ViewMode.USER && targetView !== ViewMode.HISTORY) {
          setEditingSession(null);
        }
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${view === targetView
        ? 'bg-blue-100 text-blue-700 font-bold'
        : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // Render Simple Order View
  if (view === ViewMode.SIMPLE_ORDER) {
    return <SimpleOrderForm onExit={() => setView(ViewMode.LANDING)} onAdminClick={() => setView(ViewMode.SIMPLE_ADMIN)} />;
  }

  // Render Simple Admin View
  if (view === ViewMode.SIMPLE_ADMIN) {
    if (!isSimpleAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative">
            <button onClick={() => setView(ViewMode.USER)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <LogOut size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Simple Order Admin</h2>
            <form onSubmit={handleSimpleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={simpleLoginForm.user}
                  onChange={e => setSimpleLoginForm({ ...simpleLoginForm, user: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={simpleLoginForm.pass}
                  onChange={e => setSimpleLoginForm({ ...simpleLoginForm, pass: e.target.value })}
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Login
              </button>
            </form>
          </div>
        </div>
      );
    }
    return <SimpleOrderAdmin onExit={() => { setIsSimpleAdmin(false); setView(ViewMode.LANDING); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setView(ViewMode.LANDING);
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <Package className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Xinya Frozen Logistics</h1>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-2">
              <NavButton targetView={ViewMode.LANDING} icon={Home} label="Home" />
              <NavButton targetView={ViewMode.USER} icon={Package} label="Order Catalog" />
              <NavButton targetView={ViewMode.HISTORY} icon={History} label="History" />
              <NavButton targetView={ViewMode.ADMIN} icon={ShieldCheck} label="Admin" />
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-4 space-y-2 flex flex-col">
              <NavButton targetView={ViewMode.LANDING} icon={Home} label="Home" />
              <NavButton targetView={ViewMode.USER} icon={Package} label="Order Catalog" />
              <NavButton targetView={ViewMode.HISTORY} icon={History} label="History" />
              <NavButton targetView={ViewMode.ADMIN} icon={ShieldCheck} label="Admin" />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {view === ViewMode.LANDING && (
          <LandingPage
            onSelectSimple={() => setView(ViewMode.SIMPLE_ORDER)}
            onSelectCatalog={() => setView(ViewMode.USER)}
          />
        )}

        {view === ViewMode.SIMPLE_ORDER && <SimpleOrderForm onExit={() => setView(ViewMode.LANDING)} />}

        {view === ViewMode.SIMPLE_ADMIN && (
          isSimpleAdmin ? <SimpleOrderAdmin /> : (
            <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg mt-20">
              <h2 className="text-2xl font-bold mb-6 text-center">Simple Order Admin</h2>
              <form onSubmit={handleSimpleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={simpleLoginForm.user}
                    onChange={e => setSimpleLoginForm({ ...simpleLoginForm, user: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={simpleLoginForm.pass}
                    onChange={e => setSimpleLoginForm({ ...simpleLoginForm, pass: e.target.value })}
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold">
                  Login
                </button>
              </form>
            </div>
          )
        )}

        {view === ViewMode.USER && (
          <UserDashboard
            onExit={() => {
              setView(ViewMode.LANDING);
              setEditingSession(null);
            }}
            editingSession={editingSession}
            onEditComplete={() => {
              setEditingSession(null);
              setView(ViewMode.HISTORY);
            }}
          />
        )}

        {view === ViewMode.ADMIN && (
          isAdmin ? <AdminDashboard /> : (
            <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg mt-20">
              <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={loginForm.user}
                    onChange={e => setLoginForm({ ...loginForm, user: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={loginForm.pass}
                    onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })}
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold">
                  Login
                </button>
              </form>
            </div>
          )
        )}

        {view === ViewMode.HISTORY && (
          <HistoryDashboard
            onEditSession={(session: any) => {
              setEditingSession(session);
              setView(ViewMode.USER);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Xinya Frozen Goods Distribution. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
