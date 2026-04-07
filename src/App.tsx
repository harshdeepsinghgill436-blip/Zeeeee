import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Toaster, toast } from 'react-hot-toast'
import CampaignCreate from './components/CampaignCreate'
import Dashboard from './components/Dashboard'
import { Zap } from 'lucide-react'

export type Tab = 'dashboard' | 'new'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initDB().then(() => setReady(true))
  }, [])

  async function initDB() {
    // Create tables if not exist via RPC — we use raw SQL through supabase
    try { await supabase.rpc('init_tables') } catch (_) {}
    setReady(true)
  }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-[#39ff14] text-lg animate-pulse">Initializing LeadSynth Mailer...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' } }} />

      {/* NAV */}
      <nav className="border-b border-[#1e1e1e] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-50">
        <div className="flex items-center gap-2">
          <Zap size={22} className="text-[#39ff14]" />
          <span className="font-bold text-lg tracking-tight">LeadSynth <span className="text-[#39ff14]">Mailer</span></span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'dashboard' ? 'bg-[#39ff14] text-black' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab('new')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'new' ? 'bg-[#39ff14] text-black' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'}`}
          >
            + New Campaign
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'new' ? <CampaignCreate onCreated={() => { toast.success('Campaign launched!'); setTab('dashboard') }} /> : <Dashboard />}
      </main>
    </div>
  )
}
