
import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import HistoryDashboard from './components/HistoryDashboard';
import { Package, ShieldCheck, History, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.USER);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'admin' && loginForm.pass === 'xinya-888') {
      setIsAdmin(true);
      setView(ViewMode.ADMIN);
    } else {
      alert('Invalid credentials');
    }
  };

  const NavButton = ({ targetView, icon: Icon, label }: { targetView: ViewMode, icon: any, label: string }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        view === targetView ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Xinya Frozen Logistics</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-2">
            <NavButton targetView={ViewMode.USER} icon={Package} label="Order Catalog" />
            <NavButton targetView={ViewMode.HISTORY} icon={History} label="History" />
            <NavButton targetView={ViewMode.ADMIN} icon={ShieldCheck} label="Admin" />
          </nav>

          {isAdmin && (
            <button 
              onClick={() => {setIsAdmin(false); setView(ViewMode.USER);}} 
              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
              title="Logout Admin"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {view === ViewMode.ADMIN && !isAdmin && (
          <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-center">Administrator Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={loginForm.user}
                  onChange={e => setLoginForm({...loginForm, user: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={loginForm.pass}
                  onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Verify Access
              </button>
            </form>
          </div>
        )}

        {view === ViewMode.USER && <UserDashboard />}
        {view === ViewMode.ADMIN && isAdmin && <AdminDashboard />}
        {view === ViewMode.HISTORY && <HistoryDashboard />}
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
