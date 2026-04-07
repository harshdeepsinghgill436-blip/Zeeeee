import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Key, Save, CheckCircle, Eye, EyeOff } from 'lucide-react'

interface BrevoAccount {
  key: string
  email: string
}

export function loadBrevoAccounts(): BrevoAccount[] {
  try {
    const saved = localStorage.getItem('brevo_accounts')
    if (saved) return JSON.parse(saved)
  } catch (_) {}
  return [
    { key: '', email: '' },
    { key: '', email: '' },
    { key: '', email: '' },
  ]
}

export function saveBrevoAccounts(accounts: BrevoAccount[]) {
  localStorage.setItem('brevo_accounts', JSON.stringify(accounts))
}

export default function Settings() {
  const [accounts, setAccounts] = useState<BrevoAccount[]>(loadBrevoAccounts)
  const [showKeys, setShowKeys] = useState([false, false, false])

  function update(i: number, field: 'key' | 'email', value: string) {
    const next = [...accounts]
    next[i] = { ...next[i], [field]: value }
    setAccounts(next)
  }

  function handleSave() {
    const valid = accounts.filter(a => a.key.trim() && a.email.trim())
    if (valid.length === 0) { toast.error('Add at least 1 Brevo account'); return }
    saveBrevoAccounts(accounts)
    toast.success(`${valid.length} Brevo account${valid.length > 1 ? 's' : ''} saved!`)
  }

  async function testAccount(i: number) {
    const acc = accounts[i]
    if (!acc.key || !acc.email) { toast.error('Fill in key and email first'); return }
    toast.loading('Testing...', { id: 'test' })
    try {
      // We can't call Brevo directly (CORS) so just validate format
      if (!acc.key.startsWith('xkeysib-')) {
        toast.error('Key should start with xkeysib-', { id: 'test' })
        return
      }
      if (!acc.email.includes('@')) {
        toast.error('Invalid sender email', { id: 'test' })
        return
      }
      toast.success('Format looks valid ✓', { id: 'test' })
    } catch (e: any) {
      toast.error(e.message, { id: 'test' })
    }
  }

  const configured = accounts.filter(a => a.key && a.email).length

  return (
    <div className="max-w-xl mx-auto px-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Brevo Accounts</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter your Brevo API keys. Emails rotate across all 3 accounts (300/day each = 900/day total).
        </p>
      </div>

      {configured > 0 && (
        <div className="bg-green-900/20 border border-green-800/40 rounded-2xl px-4 py-3 flex items-center gap-2 mb-4">
          <CheckCircle size={16} className="text-[#39ff14]" />
          <span className="text-sm text-green-400">{configured} account{configured > 1 ? 's' : ''} configured</span>
        </div>
      )}

      <div className="space-y-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-[#111] border border-[#222] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-300">Account {i + 1}</span>
                {accounts[i].key && accounts[i].email && (
                  <span className="text-xs text-[#39ff14]">✓ set</span>
                )}
              </div>
              <button
                onClick={() => testAccount(i)}
                className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
              >
                validate
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Sender Email</label>
              <input
                value={accounts[i].email}
                onChange={e => update(i, 'email', e.target.value)}
                placeholder="you@gmail.com"
                type="email"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#39ff14] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Brevo API Key</label>
              <div className="relative">
                <input
                  value={accounts[i].key}
                  onChange={e => update(i, 'key', e.target.value)}
                  placeholder="xkeysib-..."
                  type={showKeys[i] ? 'text' : 'password'}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#39ff14] transition-colors pr-10 font-mono"
                />
                <button
                  onClick={() => setShowKeys(s => s.map((v, j) => j === i ? !v : v))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300"
                >
                  {showKeys[i] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl font-bold text-black bg-[#39ff14] hover:bg-[#2de010] active:scale-95 transition-all flex items-center justify-center gap-2 text-base"
        >
          <Save size={18} />
          Save Keys
        </button>

        <div className="bg-[#111] border border-[#222] rounded-2xl p-4 space-y-2">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">How to get your Brevo API key</div>
          <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
            <li>Go to <span className="text-gray-300">app.brevo.com</span></li>
            <li>Click your name → <span className="text-gray-300">SMTP &amp; API</span></li>
            <li>Click <span className="text-gray-300">API Keys</span> tab → <span className="text-gray-300">Create a new API key</span></li>
            <li>Copy the key starting with <span className="text-gray-300 font-mono">xkeysib-</span></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
