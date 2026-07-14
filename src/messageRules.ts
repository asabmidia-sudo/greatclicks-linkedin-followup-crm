import type { MessageKind, Prospect, Status } from './types'

export const MAX_FOLLOW_UPS = 4

export const statusTone: Record<Status, string> = {
  'New connection': 'blue', 'Conversation started': 'blue', 'Awaiting reply': 'amber', 'Problem identified': 'green', Qualifying: 'green', Qualified: 'green',
  'Meeting interest': 'violet', 'Awaiting availability': 'violet', 'Awaiting Aaron confirmation': 'violet', 'Meeting confirmed': 'green', Nurture: 'gray', 'Follow up later': 'gray',
  'Not interested': 'gray', 'Not qualified': 'gray', 'Custom opportunity': 'red', 'Handoff required': 'red', 'Existing client support': 'red', 'Closed conversation': 'gray',
}

export function canSendFollowUp(prospect: Prospect) {
  return !prospect.hasReply && !prospect.optedOut && prospect.followUpsSent < MAX_FOLLOW_UPS && prospect.messages.some((message) => message.direction === 'outbound')
}

export function nextFollowUpDate(from = new Date()) {
  const next = new Date(from)
  next.setDate(next.getDate() + 5)
  next.setHours(9, 0, 0, 0)
  return next.toISOString()
}

export function isDue(prospect: Prospect) {
  return Boolean(prospect.nextFollowUpAt) && new Date(prospect.nextFollowUpAt).getTime() <= Date.now() && canSendFollowUp(prospect)
}

export function templateFor(prospect: Prospect, kind: MessageKind) {
  if (kind === 'intro') return `Thanks for connecting, ${prospect.name.split(' ')[0]}.\n\nI noticed your practice focuses on ${prospect.issue.toLowerCase()}.\n\nWhere does the process usually slow down for your team?`
  if (kind === 'follow-up') return `Just checking back on this, ${prospect.name.split(' ')[0]}.\n\nWhere does the process usually slow down when a new inquiry does not move forward?`
  return `Thanks for getting back to me.\n\nIt may be worth having Aaron look at the current process and see whether Greatclicks would fit.`
}

export function noEmDash(body: string) {
  return !body.includes('—') && !body.includes('–')
}

export function handoffSummary(prospect: Prospect) {
  const meeting = prospect.meeting
  return `PROSPECT DETAILS
Name: ${prospect.name}
LinkedIn profile: ${prospect.linkedinUrl || 'Not provided'}
Clinic: ${prospect.clinic}
Website: ${prospect.website || 'Not provided'}
Role: ${prospect.role}
Location: ${prospect.location || 'Not provided'}
Time zone: ${prospect.timeZone || 'Not provided'}
Email: ${prospect.email || 'Not provided'}
Phone: ${prospect.phone || 'Not provided'}

QUALIFICATION SUMMARY
Clinic type: ${prospect.clinic}
Main operational problem: ${prospect.issue || 'Not yet identified'}
Current software: ${prospect.currentSoftware || 'Not yet identified'}
Decision-maker: ${prospect.decisionMaker || 'Not yet identified'}
Urgency: ${prospect.urgency || 'Not yet identified'}
Fit: ${prospect.fit}

MEETING INFORMATION
Preferred date: ${meeting.preferredDate || 'Not provided'}
Preferred time: ${meeting.preferredTime || 'Not provided'}
Time zone: ${meeting.timeZone || prospect.timeZone || 'Not provided'}
Alternative: ${meeting.alternative || 'Not provided'}
Other attendees: ${meeting.otherAttendees || 'Not provided'}
Booking status: ${meeting.bookingStatus}`
}
