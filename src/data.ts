import type { AppData, Prospect } from './types'

const day = (offset: number) => {
  const date = new Date()
  date.setHours(9, 42, 0, 0)
  date.setDate(date.getDate() + offset)
  return date.toISOString()
}

const message = (id: string, direction: 'outbound' | 'inbound', kind: 'intro' | 'follow-up' | 'reply', body: string, offset: number) => ({
  id,
  direction,
  kind,
  body,
  createdAt: day(offset),
  approved: true,
  sentAt: direction === 'outbound' ? day(offset) : undefined,
})

export const initialProspects: Prospect[] = [
  {
    id: 'sarah-mitchell', name: 'Sarah Mitchell', role: 'Founder', clinic: 'Northstar Functional Medicine',
    linkedinUrl: 'https://www.linkedin.com/in/sarah-mitchell', website: '', location: 'Austin, TX', email: '', phone: '', timeZone: 'America/Chicago',
    status: 'Problem identified', fit: 'Strong fit', issue: 'Manual discovery call follow-up', currentSoftware: 'GHL and spreadsheets', decisionMaker: 'Yes', urgency: 'Now',
    notes: 'Asked about no-show recovery and staff ownership.', followUpsSent: 0, hasReply: true, optedOut: false, nextFollowUpAt: '',
    messages: [
      message('sarah-intro', 'outbound', 'intro', 'Thanks for connecting, Sarah.\n\nI noticed your practice focuses on functional medicine.\n\nWhere does the process usually slow down for your team, inquiries, discovery calls, or onboarding?', -2),
      message('sarah-reply', 'inbound', 'reply', 'Discovery call follow-up is the biggest issue. We still handle most of it manually.', -1),
    ],
    meeting: { preferredDate: '', preferredTime: '', timeZone: 'America/Chicago', alternative: '', otherAttendees: '', bookingStatus: 'Not requested' }, updatedAt: day(-1),
  },
  {
    id: 'marcus-lee', name: 'Dr. Marcus Lee', role: 'Medical Director', clinic: 'Restore Hormone Health',
    linkedinUrl: 'https://www.linkedin.com/in/marcus-lee', website: '', location: 'Denver, CO', email: '', phone: '', timeZone: 'America/Denver',
    status: 'Awaiting reply', fit: 'Strong fit', issue: 'Leads going cold after inquiry', currentSoftware: 'Manual email and text follow-up', decisionMaker: 'Yes', urgency: 'Within 30 days',
    notes: '', followUpsSent: 1, hasReply: false, optedOut: false, nextFollowUpAt: day(-1),
    messages: [
      message('marcus-intro', 'outbound', 'intro', 'Thanks for connecting, Marcus.\n\nHow are you currently handling follow-up when a new patient inquires but does not book right away?', -5),
      message('marcus-followup-1', 'outbound', 'follow-up', 'Just checking back on this, Marcus.\n\nWhere does the process usually slow down when an inquiry does not book?', -2),
    ],
    meeting: { preferredDate: '', preferredTime: '', timeZone: 'America/Denver', alternative: '', otherAttendees: '', bookingStatus: 'Not requested' }, updatedAt: day(-2),
  },
  {
    id: 'jamie-torres', name: 'Jamie Torres', role: 'Practice Manager', clinic: 'Brightwell Wellness',
    linkedinUrl: 'https://www.linkedin.com/in/jamie-torres', website: '', location: 'Phoenix, AZ', email: '', phone: '', timeZone: 'America/Phoenix',
    status: 'Awaiting availability', fit: 'Medium fit', issue: 'Onboarding handoffs', currentSoftware: 'Practice Better and manual reminders', decisionMaker: 'Influencer', urgency: 'Within 30 days',
    notes: 'Interested in a short conversation. Needs owner involved.', followUpsSent: 0, hasReply: true, optedOut: false, nextFollowUpAt: '',
    messages: [
      message('jamie-intro', 'outbound', 'intro', 'Thanks for connecting, Jamie.\n\nWhat part of the patient journey creates the most staff work right now?', -6),
      message('jamie-reply', 'inbound', 'reply', 'Onboarding handoffs are messy. I would be open to a short conversation with the owner involved.', -3),
    ],
    meeting: { preferredDate: '', preferredTime: '', timeZone: 'America/Phoenix', alternative: '', otherAttendees: 'Clinic owner', bookingStatus: 'Not requested' }, updatedAt: day(-3),
  },
  {
    id: 'avery-patel', name: 'Avery Patel', role: 'Operations Director', clinic: 'Integrative Pathways',
    linkedinUrl: 'https://www.linkedin.com/in/avery-patel', website: '', location: 'New York, NY', email: '', phone: '', timeZone: 'America/New_York',
    status: 'Nurture', fit: 'Medium fit', issue: 'Considering GHL', currentSoftware: 'EHR plus spreadsheets', decisionMaker: 'Yes', urgency: 'Later this year',
    notes: 'Asked to reconnect in August.', followUpsSent: 2, hasReply: true, optedOut: false, nextFollowUpAt: day(18),
    messages: [
      message('avery-intro', 'outbound', 'intro', 'Thanks for connecting, Avery.\n\nAre you currently managing lead follow-up inside a CRM, your EHR, or a mix of tools?', -20),
      message('avery-reply', 'inbound', 'reply', 'We are still evaluating options and probably will revisit this in August.', -18),
      message('avery-followup-1', 'outbound', 'follow-up', 'That makes sense.\n\nI will leave you with a note and check back closer to August.', -17),
      message('avery-followup-2', 'outbound', 'follow-up', 'Checking back as promised.\n\nHas the team decided how it wants to handle follow-up and onboarding?', -10),
    ],
    meeting: { preferredDate: '', preferredTime: '', timeZone: 'America/New_York', alternative: '', otherAttendees: '', bookingStatus: 'Not requested' }, updatedAt: day(-10),
  },
]

export const initialData: AppData = { prospects: initialProspects, lastLinkedInReviewAt: '' }
