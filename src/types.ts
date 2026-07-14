export type Status =
  | 'New connection'
  | 'Conversation started'
  | 'Awaiting reply'
  | 'Problem identified'
  | 'Qualifying'
  | 'Qualified'
  | 'Meeting interest'
  | 'Awaiting availability'
  | 'Awaiting Aaron confirmation'
  | 'Meeting confirmed'
  | 'Nurture'
  | 'Follow up later'
  | 'Not interested'
  | 'Not qualified'
  | 'Custom opportunity'
  | 'Handoff required'
  | 'Existing client support'
  | 'Closed conversation'

export type Fit = 'Strong fit' | 'Medium fit' | 'Review'
export type MessageDirection = 'outbound' | 'inbound' | 'note'
export type MessageKind = 'intro' | 'follow-up' | 'reply' | 'handoff-note'

export type Message = {
  id: string
  direction: MessageDirection
  kind: MessageKind
  body: string
  createdAt: string
  approved: boolean
  sentAt?: string
}

export type MeetingInfo = {
  preferredDate: string
  preferredTime: string
  timeZone: string
  alternative: string
  otherAttendees: string
  bookingStatus: 'Not requested' | 'Awaiting Aaron confirmation' | 'Meeting confirmed'
}

export type Prospect = {
  id: string
  name: string
  role: string
  clinic: string
  linkedinUrl: string
  website: string
  location: string
  email: string
  phone: string
  timeZone: string
  status: Status
  fit: Fit
  issue: string
  currentSoftware: string
  decisionMaker: string
  urgency: string
  notes: string
  followUpsSent: number
  hasReply: boolean
  optedOut: boolean
  nextFollowUpAt: string
  messages: Message[]
  meeting: MeetingInfo
  updatedAt: string
}

export type AppData = {
  prospects: Prospect[]
  lastLinkedInReviewAt: string
}
