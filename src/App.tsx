import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { initialData } from './data'
import { canSendFollowUp, handoffSummary, isDue, MAX_FOLLOW_UPS, nextFollowUpDate, noEmDash, statusTone, templateFor } from './messageRules'
import { loadData, saveData } from './storage'
import type { AppData, MessageKind, Prospect, Status } from './types'

type Filter = 'All' | 'Needs action' | 'Strong fit' | 'Due now'
type View = 'overview' | 'follow-ups' | 'handoffs'

const statusOptions: Status[] = [
  'New connection', 'Conversation started', 'Awaiting reply', 'Problem identified', 'Qualifying', 'Qualified', 'Meeting interest',
  'Awaiting availability', 'Awaiting Aaron confirmation', 'Meeting confirmed', 'Nurture', 'Follow up later', 'Not interested',
  'Not qualified', 'Custom opportunity', 'Handoff required', 'Existing client support', 'Closed conversation',
]

function App() {
  const [data, setData] = useState<AppData>(() => loadData(initialData))
  const [activeFilter, setActiveFilter] = useState<Filter>('All')
  const [activeView, setActiveView] = useState<View>('overview')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composer, setComposer] = useState({ kind: 'follow-up' as MessageKind, body: '', approved: false })
  const [replyBody, setReplyBody] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => saveData(data), [data])

  const selectedProspect = data.prospects.find((prospect) => prospect.id === selectedId) ?? null
  const dueProspects = data.prospects.filter(isDue)
  const activeProspects = data.prospects.filter((prospect) => !['Closed conversation', 'Not interested', 'Not qualified'].includes(prospect.status))
  const qualifiedProspects = data.prospects.filter((prospect) => ['Qualified', 'Meeting interest', 'Awaiting availability', 'Handoff required', 'Awaiting Aaron confirmation'].includes(prospect.status))
  const handoffProspects = data.prospects.filter((prospect) => ['Meeting interest', 'Awaiting availability', 'Handoff required', 'Awaiting Aaron confirmation'].includes(prospect.status))

  const filteredProspects = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.prospects.filter((prospect) => {
      const matchesSearch = !term || [prospect.name, prospect.clinic, prospect.role, prospect.issue].join(' ').toLowerCase().includes(term)
      const matchesFilter = activeFilter === 'All'
        || (activeFilter === 'Strong fit' && prospect.fit === 'Strong fit')
        || (activeFilter === 'Due now' && isDue(prospect))
        || (activeFilter === 'Needs action' && !['Nurture', 'Not interested', 'Not qualified', 'Closed conversation'].includes(prospect.status))
      const matchesView = activeView === 'overview'
        || (activeView === 'follow-ups' && isDue(prospect))
        || (activeView === 'handoffs' && handoffProspects.some((item) => item.id === prospect.id))
      return matchesSearch && matchesFilter && matchesView
    })
  }, [activeFilter, activeView, data.prospects, handoffProspects, search])

  const updateProspect = (id: string, patch: Partial<Prospect>) => {
    setData((current) => ({
      ...current,
      prospects: current.prospects.map((prospect) => prospect.id === id ? { ...prospect, ...patch, updatedAt: new Date().toISOString() } : prospect),
    }))
  }

  const openProspect = (prospect: Prospect) => {
    setSelectedId(prospect.id)
    const kind: MessageKind = prospect.hasReply ? 'reply' : prospect.messages.length === 0 ? 'intro' : 'follow-up'
    setComposer({ kind, body: templateFor(prospect, kind), approved: false })
    setReplyBody('')
  }

  const addToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  const sendComposer = () => {
    if (!selectedProspect) return
    if (!composer.body.trim()) return addToast('Write a message before approving it.')
    if (!composer.approved) return addToast('Approve the message before marking it sent.')
    if (!noEmDash(composer.body)) return addToast('Remove the em dash before sending.')
    if (composer.kind === 'intro' && selectedProspect.messages.some((message) => message.direction === 'outbound')) return addToast('An intro has already been sent to this prospect.')
    if (composer.kind === 'follow-up' && !canSendFollowUp(selectedProspect)) return addToast('This prospect is not eligible for another follow-up.')

    const now = new Date().toISOString()
    const message = { id: `${selectedProspect.id}-${Date.now()}`, direction: 'outbound' as const, kind: composer.kind, body: composer.body.trim(), createdAt: now, approved: true, sentAt: now }
    const followUpsSent = composer.kind === 'follow-up' ? selectedProspect.followUpsSent + 1 : selectedProspect.followUpsSent
    const capped = followUpsSent >= MAX_FOLLOW_UPS
    updateProspect(selectedProspect.id, {
      messages: [...selectedProspect.messages, message],
      followUpsSent,
      status: capped ? 'Closed conversation' : 'Awaiting reply',
      nextFollowUpAt: capped ? '' : nextFollowUpDate(),
    })
    setComposer({ kind: 'follow-up', body: '', approved: false })
    addToast(capped ? 'Fourth follow-up recorded. Outreach is now closed.' : 'Message recorded and next follow-up scheduled.')
  }

  const recordReply = () => {
    if (!selectedProspect || !replyBody.trim()) return
    const message = { id: `${selectedProspect.id}-reply-${Date.now()}`, direction: 'inbound' as const, kind: 'reply' as const, body: replyBody.trim(), createdAt: new Date().toISOString(), approved: true }
    updateProspect(selectedProspect.id, { messages: [...selectedProspect.messages, message], hasReply: true, nextFollowUpAt: '', status: 'Conversation started' })
    setReplyBody('')
    addToast('Reply recorded. Follow-ups are paused for this prospect.')
  }

  const stopOutreach = () => {
    if (!selectedProspect) return
    updateProspect(selectedProspect.id, { optedOut: true, nextFollowUpAt: '', status: 'Not interested' })
    addToast('Outreach stopped for this prospect.')
  }

  const handoff = () => {
    if (!selectedProspect) return
    updateProspect(selectedProspect.id, { status: 'Handoff required', meeting: { ...selectedProspect.meeting, bookingStatus: 'Awaiting Aaron confirmation' } })
    addToast('Marked for Aaron handoff.')
  }

  const copyHandoff = () => {
    if (!selectedProspect) return
    const summary = handoffSummary(selectedProspect)
    try {
      const copyPromise = navigator.clipboard?.writeText(summary)
      copyPromise?.catch(() => undefined)
    } catch {
      // Clipboard access is optional in some browser sessions.
    }
    addToast('Handoff summary copied.')
  }

  const reviewLinkedIn = () => {
    window.open('https://www.linkedin.com/messaging/', '_blank', 'noopener,noreferrer')
    setData((current) => ({ ...current, lastLinkedInReviewAt: new Date().toISOString() }))
    addToast('LinkedIn opened. Review accepted connections in your signed-in session, then import or update prospects here.')
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `greatclicks-crm-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    addToast('Backup downloaded.')
  }

  const importData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as AppData
        if (!Array.isArray(imported.prospects)) throw new Error('Invalid backup')
        setData(imported)
        addToast('Backup imported.')
      } catch {
        addToast('That file is not a valid Greatclicks backup.')
      }
      event.target.value = ''
    }
    reader.readAsText(file)
  }

  const displayDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><div className="brand-mark">G</div><div><div className="brand-name">Greatclicks</div><div className="brand-subtitle">Conversation desk</div></div></div>
        <nav className="side-nav" aria-label="Primary navigation">
          <button className={activeView === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('overview'); setActiveFilter('All') }}><span>◈</span> Overview</button>
          <button className={activeView === 'follow-ups' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('follow-ups'); setActiveFilter('Due now') }}><span>↗</span> Follow-ups <b className="nav-alert">{dueProspects.length}</b></button>
          <button className={activeView === 'handoffs' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('handoffs'); setActiveFilter('All') }}><span>→</span> Handoffs <b>{handoffProspects.length}</b></button>
        </nav>
        <div className="sidebar-note"><div className="eyebrow">Operating rule</div><p>Short messages.<br />One question at a time.<br />No invented promises.<br />Stop at four follow-ups.</p></div>
        <div className="sidebar-footer">Local workspace · v0.2</div>
      </aside>

      <section className="content" id="overview">
        <header className="topbar">
          <div><div className="eyebrow">{displayDate}</div><h1>Conversation desk</h1><p className="lede">Keep qualified clinic conversations moving without losing the human thread.</p></div>
          <div className="top-actions"><button className="secondary-button" onClick={exportData}>Export backup</button><label className="secondary-button import-button">Import backup<input type="file" accept="application/json" onChange={importData} /></label><button className="primary-button" onClick={reviewLinkedIn}>Review LinkedIn <span>↗</span></button></div>
        </header>
        <div className="bridge-status"><span className="live-dot" /> Browser bridge is manual-approval only <span className="bridge-separator">·</span> {data.lastLinkedInReviewAt ? `Last reviewed ${new Date(data.lastLinkedInReviewAt).toLocaleString()}` : 'No LinkedIn review recorded yet'}</div>

        <section className="metric-grid" aria-label="Conversation metrics">
          <Metric label="Active conversations" value={String(activeProspects.length)} detail="Not closed or opted out" tone="blue" />
          <Metric label="Need a reply" value={String(dueProspects.length)} detail="Follow-up eligible now" tone="amber" />
          <Metric label="Qualified" value={String(qualifiedProspects.length)} detail="Ready for a next step" tone="green" />
          <Metric label="Four-follow-up stops" value={String(data.prospects.filter((prospect) => prospect.followUpsSent >= MAX_FOLLOW_UPS).length)} detail="No more outreach allowed" tone="violet" />
        </section>

        <section className="workspace-panel" id="prospects">
          <div className="panel-header"><div><div className="eyebrow">{activeView === 'overview' ? 'Pipeline' : activeView === 'follow-ups' ? 'Queue' : 'Handoff queue'}</div><h2>{activeView === 'overview' ? 'Prospects in motion' : activeView === 'follow-ups' ? 'Follow-ups due' : 'Ready for Aaron'}</h2></div><div className="panel-tools"><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prospects" /></label><div className="filter-tabs" role="tablist" aria-label="Prospect filters">{(['All', 'Needs action', 'Strong fit', 'Due now'] as const).map((filter) => <button key={filter} className={activeFilter === filter ? 'filter active' : 'filter'} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div></div></div>
          <div className="table-wrap"><table><thead><tr><th>Prospect</th><th>Status</th><th>Operational friction</th><th>Next action</th><th>Follow-ups</th><th aria-label="Actions" /></tr></thead><tbody>{filteredProspects.map((prospect) => <ProspectRow key={prospect.id} prospect={prospect} onOpen={openProspect} />)}{filteredProspects.length === 0 && <tr><td colSpan={6} className="empty-state">No prospects match this queue.</td></tr>}</tbody></table></div>
        </section>

        <section className="bottom-grid" id="follow-ups"><article className="action-card"><div className="card-heading"><span className="card-icon amber-icon">↗</span><div><div className="eyebrow">Follow-up queue</div><h3>Keep the thread warm</h3></div><span className="count-badge">{dueProspects.length} due</span></div><p>Only follow up when the previous message exists and the prospect has not replied.</p><button className="text-button" onClick={() => { setActiveView('follow-ups'); setActiveFilter('Due now') }}>View follow-ups <span>→</span></button></article><article className="action-card" id="handoffs"><div className="card-heading"><span className="card-icon violet-icon">✓</span><div><div className="eyebrow">Handoff queue</div><h3>Ready for Aaron</h3></div><span className="count-badge violet-badge">{handoffProspects.length} ready</span></div><p>Collect the preferred date, time, and time zone before sending the summary.</p><button className="text-button" onClick={() => { setActiveView('handoffs'); setActiveFilter('All') }}>Review handoffs <span>→</span></button></article></section>
      </section>

      {selectedProspect && <DetailPanel prospect={selectedProspect} composer={composer} setComposer={setComposer} replyBody={replyBody} setReplyBody={setReplyBody} onClose={() => setSelectedId(null)} onUpdate={updateProspect} onSend={sendComposer} onReply={recordReply} onStop={stopOutreach} onHandoff={handoff} onCopyHandoff={copyHandoff} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  )
}

function ProspectRow({ prospect, onOpen }: { prospect: Prospect; onOpen: (prospect: Prospect) => void }) {
  const lastMessage = prospect.messages[prospect.messages.length - 1]
  return <tr><td><div className="prospect-cell"><div className="avatar">{prospect.name.split(' ').map((name) => name[0]).join('')}</div><div><strong>{prospect.name}</strong><span>{prospect.role} · {prospect.clinic}</span></div></div></td><td><span className={`status-pill ${statusTone[prospect.status]}`}>{prospect.status}</span></td><td><span className="issue">{prospect.issue || 'Not identified yet'}</span><small>{prospect.fit}</small></td><td><div className="next-action">{isDue(prospect) ? 'Follow-up due now' : prospect.nextFollowUpAt ? `Next review ${new Date(prospect.nextFollowUpAt).toLocaleDateString()}` : prospect.hasReply ? 'Review latest reply' : 'Start the conversation'}<small>Last touch: {lastMessage ? new Date(lastMessage.createdAt).toLocaleDateString() : 'Not yet'}</small></div></td><td><span className={prospect.followUpsSent >= MAX_FOLLOW_UPS ? 'followup-count maxed' : 'followup-count'}>{prospect.followUpsSent}/{MAX_FOLLOW_UPS}</span></td><td><button className="row-action" onClick={() => onOpen(prospect)}>Open <span>→</span></button></td></tr>
}

function DetailPanel({ prospect, composer, setComposer, replyBody, setReplyBody, onClose, onUpdate, onSend, onReply, onStop, onHandoff, onCopyHandoff }: { prospect: Prospect; composer: { kind: MessageKind; body: string; approved: boolean }; setComposer: (value: { kind: MessageKind; body: string; approved: boolean }) => void; replyBody: string; setReplyBody: (value: string) => void; onClose: () => void; onUpdate: (id: string, patch: Partial<Prospect>) => void; onSend: () => void; onReply: () => void; onStop: () => void; onHandoff: () => void; onCopyHandoff: () => void }) {
  const outboundExists = prospect.messages.some((message) => message.direction === 'outbound')
  const canFollowUp = canSendFollowUp(prospect)
  const setMeeting = (field: keyof Prospect['meeting'], value: string) => onUpdate(prospect.id, { meeting: { ...prospect.meeting, [field]: value } })
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="detail-drawer" aria-label={`Details for ${prospect.name}`}><header className="drawer-header"><div><div className="eyebrow">Prospect details</div><h2>{prospect.name}</h2><p>{prospect.role} · {prospect.clinic}</p></div><button className="close-button" onClick={onClose} aria-label="Close details">×</button></header><div className="drawer-scroll"><section className="detail-section"><div className="detail-title"><span className={`status-pill ${statusTone[prospect.status]}`}>{prospect.status}</span><span className="fit-label">{prospect.fit}</span><span className="followup-count">{prospect.followUpsSent}/{MAX_FOLLOW_UPS} follow-ups</span></div><div className="field-grid"><Field label="Role" value={prospect.role} onChange={(value) => onUpdate(prospect.id, { role: value })} /><Field label="Clinic" value={prospect.clinic} onChange={(value) => onUpdate(prospect.id, { clinic: value })} /><Field label="LinkedIn URL" value={prospect.linkedinUrl} onChange={(value) => onUpdate(prospect.id, { linkedinUrl: value })} /><Field label="Website" value={prospect.website} onChange={(value) => onUpdate(prospect.id, { website: value })} /><Field label="Time zone" value={prospect.timeZone} onChange={(value) => onUpdate(prospect.id, { timeZone: value })} /><Field label="Current software" value={prospect.currentSoftware} onChange={(value) => onUpdate(prospect.id, { currentSoftware: value })} /><Field label="Main problem" value={prospect.issue} onChange={(value) => onUpdate(prospect.id, { issue: value })} /><label className="field"><span>Status</span><select value={prospect.status} onChange={(event) => onUpdate(prospect.id, { status: event.target.value as Status })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label></div></section><section className="detail-section"><div className="section-heading"><div><div className="eyebrow">Conversation history</div><h3>Messages</h3></div><span className="message-count">{prospect.messages.length}</span></div><div className="message-list">{prospect.messages.map((message) => <div className={`message ${message.direction}`} key={message.id}><div className="message-meta"><span>{message.direction === 'inbound' ? prospect.name : message.direction === 'outbound' ? 'Aaron · Greatclicks' : 'Note'}</span><time>{new Date(message.createdAt).toLocaleString()}</time></div><p>{message.body}</p>{message.direction === 'outbound' && <small>{message.sentAt ? 'Sent' : 'Draft'}</small>}</div>)}</div><div className="reply-box"><div className="eyebrow">Record a reply</div><textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Paste the prospect's reply here" rows={3} /><button className="secondary-button" onClick={onReply} disabled={!replyBody.trim()}>Record reply and pause follow-ups</button></div></section><section className="detail-section composer-section"><div className="section-heading"><div><div className="eyebrow">Approval queue</div><h3>Prepare a message</h3></div><span className={composer.approved ? 'approved-badge' : 'draft-badge'}>{composer.approved ? 'Approved' : 'Draft'}</span></div><div className="composer-controls"><select value={composer.kind} onChange={(event) => { const kind = event.target.value as MessageKind; setComposer({ kind, body: templateFor(prospect, kind), approved: false }) }}><option value="intro" disabled={outboundExists}>Intro</option><option value="follow-up" disabled={!canFollowUp}>Follow-up</option><option value="reply" disabled={!prospect.hasReply}>Reply</option></select><span className="composer-rule">Short lines · no em dash</span></div><textarea value={composer.body} onChange={(event) => setComposer({ ...composer, body: event.target.value, approved: false })} rows={7} placeholder="Write a short message" /><div className="composer-actions"><label className="approval-check"><input type="checkbox" checked={composer.approved} onChange={(event) => setComposer({ ...composer, approved: event.target.checked })} /> I reviewed this message</label><button className="primary-button" onClick={onSend}>Mark sent</button></div><p className="microcopy">This records the message locally. It does not send anything to LinkedIn automatically.</p></section><section className="detail-section"><div className="section-heading"><div><div className="eyebrow">Meeting handoff</div><h3>Collect availability</h3></div><button className="text-button" onClick={onCopyHandoff}>Copy summary</button></div><div className="field-grid"><Field label="Preferred date" value={prospect.meeting.preferredDate} onChange={(value) => setMeeting('preferredDate', value)} /><Field label="Preferred time" value={prospect.meeting.preferredTime} onChange={(value) => setMeeting('preferredTime', value)} /><Field label="Time zone" value={prospect.meeting.timeZone} onChange={(value) => setMeeting('timeZone', value)} /><Field label="Other attendees" value={prospect.meeting.otherAttendees} onChange={(value) => setMeeting('otherAttendees', value)} /></div><button className="handoff-button" onClick={onHandoff}>Mark ready for Aaron</button></section><section className="detail-section danger-section"><button className="danger-button" onClick={onStop}>Stop outreach</button><span>Stops all future follow-ups for this prospect.</span></section></div></aside></div>
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><input aria-label={label.toUpperCase()} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <article className="metric-card"><div className={`metric-dot ${tone}`} /><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></article>
}

export default App
