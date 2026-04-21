// src/components/OwnerHistorySection.tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarIcon, DollarSignIcon, BuildingIcon, MessageCircleIcon,
  StarIcon, BellIcon, CheckCircleIcon, XIcon, AlertTriangleIcon,
  PlusIcon, EditIcon, TrashIcon, ImageIcon, VideoIcon, PhoneIcon,
  MailIcon, ClockIcon, CreditCardIcon, ShieldAlertIcon, BellRingIcon,
  DownloadIcon, SearchIcon, FilterIcon, ActivityIcon, RefreshCcwIcon,
  CheckIcon,
} from 'lucide-react'

// ─── Crown SVG fallback (not in lucide-react) ────────────────────────────────
const CrownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20" />
    <path d="M5 20l-2-9 5 4 4-8 4 8 5-4-2 9" />
  </svg>
)

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  myBookings: any[]
  notifs: any[]
  totalRev: number
  properties: any[]
  historyTab: string
  setHistoryTab: (t: string) => void
  fmtNPR: (n: number) => string
  daysAgo: (n: number) => string
  MOCK_INVOICES: any[]
  MOCK_REVIEWS: any[]
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'bookings',      label: 'Bookings',           icon: CalendarIcon },
  { id: 'payments',      label: 'Payments',            icon: CreditCardIcon },
  { id: 'property',      label: 'Property Activity',   icon: BuildingIcon },
  { id: 'interactions',  label: 'Interactions',        icon: MessageCircleIcon },
  { id: 'reviews',       label: 'Reviews',             icon: StarIcon },
  { id: 'notifications', label: 'Notifications',       icon: BellRingIcon },
  { id: 'subscription',  label: 'Subscription',        icon: CrownIcon },
  { id: 'admin',         label: 'Admin Actions',       icon: ShieldAlertIcon },
]

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'confirmed' || status === 'approved' || status === 'paid' || status === 'Active'
      ? 'bg-green-100 text-green-700'
      : status === 'rejected' || status === 'failed'
      ? 'bg-red-100 text-red-700'
      : status === 'Expired'
      ? 'bg-gray-100 text-gray-500'
      : 'bg-amber-100 text-amber-700'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${cls}`}>
      {status}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function OwnerHistorySection({
  myBookings, notifs, totalRev, properties, historyTab, setHistoryTab,
  fmtNPR, daysAgo, MOCK_INVOICES, MOCK_REVIEWS,
}: Props) {
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // KPI values
  const totalBookings    = myBookings.length
  const confirmedBookings = myBookings.filter((b: any) => b.status === 'confirmed').length
  const avgRating = MOCK_REVIEWS.length > 0
    ? (MOCK_REVIEWS.reduce((s: number, r: any) => s + (r.rating || 0), 0) / MOCK_REVIEWS.length).toFixed(1)
    : '—'

  // CSV export
  const exportCSV = () => {
    const rows = myBookings.map((b: any) =>
      [b.receiptId || '', b.propertyTitle || '', b.customerName || '', b.moveInDate || '', b.status || '', b.paymentType || ''].join(',')
    )
    const csv = ['Receipt ID,Property,Tenant,Move-in,Status,Payment', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'booking-history.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Filtered bookings
  const filteredBookings = myBookings
    .filter((b: any) => filterStatus === 'all' || b.status === filterStatus)
    .filter((b: any) => !search || (b.propertyTitle + ' ' + b.customerName).toLowerCase().includes(search.toLowerCase()))

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Bookings',    value: totalBookings,       icon: CalendarIcon,    from: 'from-blue-50',    to: 'to-blue-100',    border: 'border-blue-100',    iconBg: 'bg-white/80', val: 'text-blue-800'    },
          { label: 'Total Earnings',    value: fmtNPR(totalRev),    icon: DollarSignIcon,  from: 'from-green-50',   to: 'to-green-100',   border: 'border-green-100',   iconBg: 'bg-white/80', val: 'text-green-800'   },
          { label: 'Avg Rating',        value: avgRating === '—' ? '—' : `${avgRating} ★`, icon: StarIcon, from: 'from-amber-50', to: 'to-amber-100', border: 'border-amber-100', iconBg: 'bg-white/80', val: 'text-amber-800' },
          { label: 'Confirmed Bookings',value: confirmedBookings,   icon: CheckCircleIcon, from: 'from-emerald-50', to: 'to-emerald-100', border: 'border-emerald-100', iconBg: 'bg-white/80', val: 'text-emerald-800' },
        ].map((kpi, i) => (
          <motion.div key={i} whileHover={{ y: -2 }}
            className={`bg-gradient-to-br ${kpi.from} ${kpi.to} border ${kpi.border} rounded-2xl p-4`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-8 h-8 ${kpi.iconBg} rounded-xl flex items-center justify-center shadow-sm`}>
                <kpi.icon className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <p className={`text-lg font-black ${kpi.val}`}>{kpi.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filter / Search / Export row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white border border-gray-200 rounded-xl px-3 py-2">
          <SearchIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search history…"
            className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder-gray-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={exportCSV}
          className="flex items-center gap-1.5 text-xs text-button-primary font-semibold hover:underline">
          <DownloadIcon className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* ── Sub-tab navigation ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
        {TABS.map(tab => {
          const Icon    = tab.icon
          const isActive = historyTab === tab.id
          return (
            <button key={tab.id} onClick={() => setHistoryTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition-all ${
                isActive
                  ? 'bg-button-primary/10 text-button-primary font-bold rounded-xl px-3 py-2 text-xs'
                  : 'text-gray-500 hover:bg-gray-50 rounded-xl px-3 py-2 text-xs'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: BOOKINGS
      ══════════════════════════════════════════════════════════════════════ */}
      {historyTab === 'bookings' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-button-primary" />
              <span className="text-sm font-bold text-gray-800">Booking History</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-semibold">
                {filteredBookings.length} bookings
              </span>
            </div>
            <button onClick={() => { setSearch(''); setFilterStatus('all') }}
              className="flex items-center gap-1.5 text-xs text-button-primary font-semibold hover:underline">
              <RefreshCcwIcon className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No bookings found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Receipt ID', 'Property', 'Tenant', 'Booking Date', 'Stay Duration', 'Payment Type', 'Status', 'Rejection Reason'].map(h => (
                      <th key={h} className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b: any, i: number) => (
                    <motion.tr key={b.receiptId || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-xs font-mono text-button-primary">{b.receiptId || `#${i + 1}`}</td>
                      <td className="p-3 text-xs text-gray-700 max-w-[140px] truncate">{b.propertyTitle || '—'}</td>
                      <td className="p-3 text-xs text-gray-700">{b.customerName || '—'}</td>
                      <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{b.moveInDate || b.bookingDate || '—'}</td>
                      <td className="p-3 text-xs text-gray-700">{b.duration || b.stayDuration || '—'}</td>
                      <td className="p-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                          b.paymentType === 'advance' ? 'bg-blue-100 text-blue-700'
                          : b.paymentType === 'full'  ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>{b.paymentType || 'cash'}</span>
                      </td>
                      <td className="p-3"><StatusBadge status={b.status || 'pending'} /></td>
                      <td className="p-3 text-xs text-red-500 max-w-[160px] truncate">{b.rejectionReason || '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredBookings.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: 'Total Bookings', value: filteredBookings.length,                                                                    color: 'from-blue-500 to-blue-600' },
                { label: 'Confirmed',      value: filteredBookings.filter((b: any) => b.status === 'confirmed').length,                       color: 'from-emerald-500 to-emerald-600' },
                { label: 'Pending',        value: filteredBookings.filter((b: any) => b.status === 'pending' || b.status === 'requested').length, color: 'from-amber-500 to-amber-600' },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-center text-white`}>
                  <p className="text-xl font-black">{s.value}</p>
                  <p className="text-xs font-semibold text-white/80">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PAYMENTS
      ══════════════════════════════════════════════════════════════════════ */}
      {historyTab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Total earnings hero card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-center text-white">
            <p className="text-xs font-semibold text-white/80 mb-1">Total Earnings</p>
            <p className="text-3xl font-black">{fmtNPR(totalRev)}</p>
            <p className="text-xs text-white/70 mt-1">
              {MOCK_INVOICES.filter((inv: any) => inv.status === 'paid').length} paid transactions
            </p>
          </div>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <CreditCardIcon className="w-4 h-4 text-button-primary" />
              <span className="text-sm font-bold text-gray-800">Payment Transactions</span>
            </div>
          </div>

          {MOCK_INVOICES.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <CreditCardIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No payment records yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Invoice ID', 'Tenant', 'Property', 'Amount', 'Payment Method', 'Date', 'Transaction ID', 'Status'].map(h => (
                      <th key={h} className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_INVOICES.map((inv: any, i: number) => (
                    <motion.tr key={inv.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-xs font-mono text-button-primary">{inv.id}</td>
                      <td className="p-3 text-xs text-gray-700">{inv.tenant}</td>
                      <td className="p-3 text-xs text-gray-700 max-w-[120px] truncate">{inv.property}</td>
                      <td className="p-3 text-xs font-bold text-gray-900">{fmtNPR(inv.amount)}</td>
                      <td className="p-3 text-xs text-gray-700">{inv.method || 'Khalti'}</td>
                      <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{inv.date}</td>
                      <td className="p-3 text-xs font-mono text-gray-400">{inv.txnId || `TXN-${inv.id?.slice(-4) || '0000'}`}</td>
                      <td className="p-3"><StatusBadge status={inv.status} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Total Invoices', value: MOCK_INVOICES.length,                                              color: 'from-blue-500 to-blue-600' },
              { label: 'Paid',           value: MOCK_INVOICES.filter((i: any) => i.status === 'paid').length,      color: 'from-green-500 to-green-600' },
              { label: 'Pending',        value: MOCK_INVOICES.filter((i: any) => i.status === 'pending').length,   color: 'from-amber-500 to-amber-600' },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-center text-white`}>
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-xs font-semibold text-white/80">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PROPERTY ACTIVITY (vertical timeline)
      ══════════════════════════════════════════════════════════════════════ */}
      {historyTab === 'property' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <ActivityIcon className="w-4 h-4 text-button-primary" />
              <span className="text-sm font-bold text-gray-800">Property Activity Timeline</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
              {[
                { action: 'Property Added',   property: properties[0]?.title || 'Modern 2BHK',  date: daysAgo(45), Icon: PlusIcon,  color: 'bg-green-100 text-green-600' },
                { action: 'Images Updated',   property: properties[1]?.title || 'Spacious 3BHK', date: daysAgo(30), Icon: ImageIcon, color: 'bg-blue-100 text-blue-600' },
                { action: 'Property Edited',  property: properties[0]?.title || 'Cozy Studio',   date: daysAgo(15), Icon: EditIcon,  color: 'bg-amber-100 text-amber-600' },
                { action: 'Video Uploaded',   property: properties[0]?.title || 'Modern 2BHK',   date: daysAgo(10), Icon: VideoIcon, color: 'bg-purple-100 text-purple-600' },
                { action: 'Property Deleted', property: 'Old Flat',                               date: daysAgo(5),  Icon: TrashIcon, color: 'bg-red-100 text-red-600' },
              ].map((a, idx) => (
                <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.06 }}
                  className="relative flex items-start gap-4 pb-6 last:pb-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${a.color}`}>
                    <a.Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-xs font-bold text-gray-800">{a.action}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{a.property}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 pt-2 whitespace-nowrap">{a.date}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: TENANT INTERACTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {historyTab === 'interactions' && (() => {
        const INTERACTIONS = [
          { type: 'Message Sent',     tenant: 'Anita Thapa',    property: 'Modern 2BHK',  time: '5m ago',  Icon: MessageCircleIcon },
          { type: 'Contact Request',  tenant: 'Ram Bahadur',    property: '3BHK Flat',    time: '1h ago',  Icon: PhoneIcon },
          { type: 'Booking Inquiry',  tenant: 'Sita Gurung',    property: 'Studio Room',  time: '2h ago',  Icon: MailIcon },
          { type: 'Message Received', tenant: 'Priya Maharjan', property: 'Modern 2BHK',  time: '1d ago',  Icon: MessageCircleIcon },
          { type: 'Contact Request',  tenant: 'Bikash Shrestha',property: '3BHK Flat',    time: '2d ago',  Icon: PhoneIcon },
        ]
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <MessageCircleIcon className="w-4 h-4 text-button-primary" />
                <span className="text-sm font-bold text-gray-800">Tenant Interactions</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Type', 'Tenant', 'Property', 'Time'].map(h => (
                      <th key={h} className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INTERACTIONS.map((item, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <item.Icon className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="text-xs text-gray-700 font-medium">{item.type}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-gray-700">{item.tenant}</td>
                      <td className="p-3 text-xs text-gray-700">{item.property}</td>
                      <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{item.time}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: REVIEWS
      ══════════════════════════════════════════════════════════════════════ */}
      {historyTab === 'reviews' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <StarIcon className="w-4 h-4 text-button-primary" />
              <span className="text-sm font-bold text-gray-800">Reviews & Ratings</span>
            </div>
          </div>

          {MOCK_REVIEWS.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <StarIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No reviews yet.</p>
              <p className="text-[11px] text-gray-300 mt-1">Tenant reviews will appear here once submitted.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Tenant', 'Property', 'Rating', 'Comment', 'Date'].map(h => (
                      <th key={h} className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_REVIEWS.map((r: any, i: number) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-xs text-gray-700 font-medium">{r.tenant}</td>
                      <td className="p-3 text-xs text-gray-700">{r.property}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <StarIcon key={n} className={`w-3 h-3 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-gray-700 max-w-[200px] truncate">{r.comment}</td>
                      <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{r.date}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: NOTIFICATIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {historyTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <BellRingIcon className="w-4 h-4 text-button-primary" />
              <span className="text-sm font-bold text-gray-800">Notification History</span>
            </div>
          </div>

          {notifs.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <BellIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No notifications yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Type', 'Title', 'Message', 'Time'].map(h => (
                      <th key={h} className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {notifs.map((n: any, i: number) => {
                    const iconCls =
                      n.type === 'success' ? 'bg-green-50 text-green-600'
                      : n.type === 'warning' ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                    return (
                      <motion.tr key={n.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconCls}`}>
                            <BellIcon className="w-3.5 h-3.5" />
                          </div>
                        </td>
                        <td className="p-3 text-xs font-bold text-gray-800">{n.title}</td>
                        <td className="p-3 text-xs text-gray-700 max-w-[240px] truncate">{n.msg}</td>
                        <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{n.time}</td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: SUBSCRIPTION
      ══════════════════════════════════════════════════════════════════════ */}
      {historyTab === 'subscription' && (() => {
        const PLANS = [
          {
            plan: 'Premium Video Upload',
            amount: 5000,
            start: daysAgo(30),
            expiry: daysAgo(-30),
            features: ['Video Upload', 'Priority Listing', 'Analytics Dashboard', 'Verified Badge'],
            status: 'Active',
          },
          {
            plan: 'Basic Plan',
            amount: 2000,
            start: daysAgo(90),
            expiry: daysAgo(30),
            features: ['Standard Listing', 'Basic Analytics'],
            status: 'Expired',
          },
        ]
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <CrownIcon className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-800">Subscription & Plans</span>
              </div>
            </div>

            <div className="space-y-4">
              {PLANS.map((sub, idx) => (
                <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.06 }}
                  className={`rounded-2xl p-4 ${sub.status === 'Active'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                    : 'bg-white border border-gray-100 shadow-sm'
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CrownIcon className={`w-5 h-5 ${sub.status === 'Active' ? 'text-white' : 'text-amber-500'}`} />
                      <p className={`font-bold text-sm ${sub.status === 'Active' ? 'text-white' : 'text-gray-900'}`}>{sub.plan}</p>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {sub.features.map((f, fi) => (
                      <span key={fi} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sub.status === 'Active' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <CheckIcon className="w-2.5 h-2.5" />{f}
                      </span>
                    ))}
                  </div>

                  <div className={`flex items-center justify-between text-xs rounded-xl p-2.5 ${
                    sub.status === 'Active' ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-600'
                  }`}>
                    <span className="font-bold">{sub.amount.toLocaleString()} NPR</span>
                    <span className={sub.status === 'Active' ? 'text-white/80' : 'text-gray-400'}>
                      {sub.start} → {sub.expiry}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ADMIN ACTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {historyTab === 'admin' && (() => {
        const ADMIN_ACTIONS = [
          { action: 'Property Approved', property: 'Modern 2BHK',  date: daysAgo(40), reason: '',                              Icon: CheckCircleIcon,  status: 'approved' },
          { action: 'Property Rejected', property: 'Old Flat',     date: daysAgo(20), reason: 'Incomplete information',        Icon: XIcon,            status: 'rejected' },
          { action: 'Warning Issued',    property: 'Studio Room',  date: daysAgo(10), reason: 'Missing required documents',    Icon: AlertTriangleIcon, status: 'warning' },
          { action: 'Property Approved', property: 'Spacious 3BHK',date: daysAgo(60), reason: '',                              Icon: CheckCircleIcon,  status: 'approved' },
        ]
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <ShieldAlertIcon className="w-4 h-4 text-button-primary" />
                <span className="text-sm font-bold text-gray-800">Admin Actions & Moderation</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[550px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Action', 'Property', 'Date', 'Reason'].map(h => (
                      <th key={h} className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_ACTIONS.map((a, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            a.status === 'approved' ? 'bg-green-50 text-green-600'
                            : a.status === 'rejected' ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                          }`}>
                            <a.Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-medium text-gray-800">{a.action}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-gray-700">{a.property}</td>
                      <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{a.date}</td>
                      <td className="p-3 text-xs text-gray-500">{a.reason || '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      })()}

    </motion.div>
  )
}