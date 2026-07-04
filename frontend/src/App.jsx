import { useState, useEffect, useCallback } from 'react'
import {
  Bell, Send, TrendingUp, DollarSign, Activity,
  CheckCircle, Clock, AlertCircle, X, ChevronDown,
  ArrowUpRight, Loader2
} from 'lucide-react'


// ── API base: relative paths work in both Vite proxy (dev)
//    and K8s Ingress routing (production)
const API = '/api/v1'


// ── Utility helpers ───────────────────────────────────────────────────
function fmtAmount(amount, currency = 'NGN') {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency, minimumFractionDigits: 2
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}


function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-NG', {
    dateStyle: 'medium', timeStyle: 'short'
  })
}


// ── Sub-components ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={18} className="text-white" />
        </div>
        <ArrowUpRight size={14} className="text-gray-600" />
      </div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}


function Badge({ status }) {
  const map = {
    completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    pending:   'text-amber-400 bg-amber-400/10 border-amber-400/20',
    failed:    'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${map[status] || map.completed}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}


function SendModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    recipient: '', amount: '', currency: 'NGN', description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')


  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))


  const submit = async () => {
    if (!form.recipient.trim() || !form.amount) {
      setError('Recipient and amount are required.')
      return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
      })
      if (!res.ok) throw new Error()
      await res.json()
      onSuccess()
      onClose()
    } catch {
      setError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Send Payment</h2>
            <p className="text-sm text-gray-400">Transfer funds instantly across Africa</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>


        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Recipient</label>
            <input name="recipient" value={form.recipient} onChange={handle}
              placeholder="Account name or number"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                         placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
          </div>


          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
              <input name="amount" type="number" min="0" value={form.amount} onChange={handle}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                           placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium text-gray-400 mb-2">Currency</label>
              <div className="relative">
                <select name="currency" value={form.currency} onChange={handle}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white
                             appearance-none focus:outline-none focus:border-emerald-500 transition-colors text-sm">
                  {['NGN','GHS','KES','USD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <input name="description" value={form.description} onChange={handle}
              placeholder="What's this payment for?"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                         placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm" />
          </div>


          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>


        <div className="flex gap-3 p-6 border-t border-gray-800">
          <button onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-xl py-3 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl
                       py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <><Send size={15} /> Send Payment</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const [payments,      setPayments]      = useState([])
  const [notifications, setNotifications] = useState([])
  const [showModal,     setShowModal]     = useState(false)
  const [showNotifs,    setShowNotifs]    = useState(false)
  const [loading,       setLoading]       = useState(true)


  const fetchAll = useCallback(async () => {
    try {
      const [pr, nr] = await Promise.all([
        fetch(`${API}/payments`),
        fetch(`${API}/notifications`)
      ])
      const [pmts, ntfs] = await Promise.all([pr.json(), nr.json()])
      setPayments(Array.isArray(pmts) ? pmts : [])
      setNotifications(Array.isArray(ntfs) ? ntfs : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])


  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 10000)
    return () => clearInterval(id)
  }, [fetchAll])


  const totalSent   = payments.reduce((s, p) => s + p.amount, 0)
  const completed   = payments.filter(p => p.status === 'completed').length
  const successRate = payments.length ? Math.round((completed / payments.length) * 100) : 100


  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── Header ── */}
      <header className="bg-gray-900/80 border-b border-gray-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl
                            flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <span className="text-white font-black text-base">₦</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">PayStream</span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10
                               border border-emerald-400/20 px-2 py-0.5 rounded-full">LIVE</span>
            </div>
          </div>


          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowNotifs(v => !v)}
                className="w-9 h-9 rounded-xl border border-gray-700 flex items-center justify-center
                           text-gray-400 hover:text-white hover:border-gray-600 transition-all">
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full
                                   text-white text-[10px] font-bold flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>


              {showNotifs && (
                <div className="absolute right-0 top-11 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    <button onClick={() => setShowNotifs(false)} className="text-gray-500 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">No notifications yet</p>
                    ) : (
                      [...notifications].reverse().map(n => (
                        <div key={n.id} className="px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/40">
                          <p className="text-sm text-gray-200">{n.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{fmtDate(n.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>


            <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full
                            flex items-center justify-center text-sm font-bold text-white shadow-lg">
              A
            </div>
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={TrendingUp} label="Total Sent"    value={fmtAmount(totalSent)} sub="This session"    accent="bg-emerald-600" />
          <StatCard icon={DollarSign} label="Balance"       value="₦2,500,000.00"        sub="Available"       accent="bg-blue-600"   />
          <StatCard icon={Activity}   label="Transactions"  value={payments.length}       sub="Total processed" accent="bg-purple-600" />
          <StatCard icon={CheckCircle} label="Success Rate" value={`${successRate}%`}    sub="All time"        accent="bg-teal-600"   />
        </div>


        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


          {/* Transaction table */}
          <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="font-semibold text-white">Recent Transaction</h2>
                <p className="text-xs text-gray-500 mt-0.5">{payments.length} total</p>
              </div>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white
                           rounded-xl px-4 py-2 text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30">
                <Send size={13} /> Send Payment
              </button>
            </div>


            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="text-emerald-500 animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-600">
                <Activity size={36} className="mb-3 opacity-30" />
                <p className="font-medium text-gray-400">No transactions yet</p>
                <p className="text-sm mt-1">Send your first payment to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Ref','Recipient','Amount','Status','Time'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...payments].reverse().map(p => (
                      <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{p.id.slice(0,8)}&hellip;</td>
                        <td className="px-6 py-4 text-sm font-medium text-white">{p.recipient}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-400">{fmtAmount(p.amount, p.currency)}</td>
                        <td className="px-6 py-4"><Badge status={p.status} /></td>
                        <td className="px-6 py-4 text-xs text-gray-500">{fmtDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>


          {/* Right panel */}
          <div className="space-y-4">
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
              <button onClick={() => setShowModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500
                           text-white rounded-xl py-3 text-sm font-semibold transition-colors mb-3
                           shadow-lg shadow-emerald-900/30">
                <Send size={15} /> New Payment
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800/60 rounded-xl p-3 text-center border border-gray-700/50">
                  <Clock size={16} className="mx-auto mb-1.5 text-amber-400" />
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-white">{payments.filter(p=>p.status==='pending').length}</p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-3 text-center border border-gray-700/50">
                  <CheckCircle size={16} className="mx-auto mb-1.5 text-emerald-400" />
                  <p className="text-xs text-gray-500">Done</p>
                  <p className="text-xl font-bold text-white">{completed}</p>
                </div>
              </div>
            </div>


            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {[...notifications].slice(-5).reverse().map(n => (
                    <div key={n.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-600/20 border border-emerald-500/30
                                      flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle size={12} className="text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-300 leading-snug">{n.message}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{fmtDate(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>


      {showModal && <SendModal onClose={() => setShowModal(false)} onSuccess={fetchAll} />}
    </div>
  )
}
