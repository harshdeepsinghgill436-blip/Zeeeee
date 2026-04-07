import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Toaster, toast } from 'react-hot-toast'
import CampaignCreate from './components/CampaignCreate'
import Dashboard from './components/Dashboard'
import { Zap, LayoutDashboard, Plus } from 'lucide-react'

export type Tab = 'dashboard' | 'new'

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
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'dashboard' ? 'bg-[#39ff14] text-black' : 'bg-[#151515] text-gray-400 hover:text-white'}`}
          >
            <LayoutDashboard size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'new' ? 'bg-[#39ff14] text-black' : 'bg-[#151515] text-gray-400 hover:text-white'}`}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Campaign</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {tab === 'new'
          ? <CampaignCreate onCreated={() => { toast.success('Campaign launched!'); setTab('dashboard') }} />
          : <Dashboard />
        }
      </main>

      {/* Mobile bottom nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-[#141414] bg-[#0a0a0a]/95 backdrop-blur flex">
        <button
          onClick={() => setTab('dashboard')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${tab === 'dashboard' ? 'text-[#39ff14]' : 'text-gray-600'}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>
        <button
          onClick={() => setTab('new')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${tab === 'new' ? 'text-[#39ff14]' : 'text-gray-600'}`}
        >
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="sm:hidden h-16" />
    </div>
  )
}
