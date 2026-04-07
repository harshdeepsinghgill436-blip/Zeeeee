import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Toaster, toast } from 'react-hot-toast'
import CampaignCreate from './components/CampaignCreate'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import { Zap, LayoutDashboard, Plus, Settings as SettingsIcon } from 'lucide-react'

export type Tab = 'dashboard' | 'new' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initDB().then(() => setReady(true))
  }, [])

  async function initDB() {
    try { await supabase.rpc('init_tables') } catch (_) {}
    setReady(true)
  }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex items-center gap-2 text-[#39ff14]">
        <Zap size={20} className="animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: '14px' }
      }} />

      {/* Top nav */}
      <nav className="border-b border-[#141414] px-4 py-3 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-50">
        <div className="flex items-center gap-1.5">
          <Zap size={18} className="text-[#39ff14]" />
          <span className="font-bold text-base tracking-tight">LeadSynth <span className="text-[#39ff14]">Mailer</span></span>
        </div>
        <div className="hidden sm:flex gap-1.5">
          {(['dashboard', 'new', 'settings'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-[#39ff14] text-black' : 'bg-[#151515] text-gray-400 hover:text-white'}`}>
              {t === 'new' ? '+ New' : t}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full pb-24 sm:pb-6">
        {tab === 'new'
          ? <CampaignCreate onCreated={() => { toast.success('Campaign launched!'); setTab('dashboard') }} onGoSettings={() => setTab('settings')} />
          : tab === 'settings'
          ? <Settings />
          : <Dashboard />
        }
      </main>

      {/* Mobile bottom nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-[#141414] bg-[#0a0a0a]/95 backdrop-blur flex safe-bottom">
        {[
          { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { id: 'new', icon: <Plus size={20} />, label: 'New' },
          { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Settings' },
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id as Tab)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${tab === item.id ? 'text-[#39ff14]' : 'text-gray-600'}`}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
