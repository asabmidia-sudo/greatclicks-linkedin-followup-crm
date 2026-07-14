# Greatclicks LinkedIn Follow-up CRM

Local-first, human-approved conversation desk for Greatclicks LinkedIn outreach.

## Working features

- Persistent prospect data in browser local storage
- Searchable pipeline with status, fit, operational friction, and next action
- Prospect detail drawer with editable qualification fields
- Full inbound and outbound message history
- Intro, follow-up, and reply composer
- Approval checkbox before a message can be marked sent
- Short-message guardrail and em dash validation
- Follow-up eligibility guardrails
  - Previous outbound message required
  - Prospect reply pauses all follow-ups
  - Opt-out stops all outreach
  - Maximum of four follow-ups
  - Fourth follow-up closes outreach
- Due follow-up queue
- Meeting date, time, time zone, and attendee capture
- Handoff summary generation and clipboard copy
- JSON export and import backups
- Manual LinkedIn browser bridge

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

## Open the LinkedIn bridge

```powershell
npm.cmd run linkedin:review
```

The bridge opens LinkedIn in a browser session. You sign in yourself and review accepted connections manually. It does not receive your password, scrape a batch of profiles, or send messages automatically.

Messages are recorded in this app after you review and send them in LinkedIn. This keeps the final send action human-approved and avoids claiming a message was sent when it was not.

## Backup

Use **Export backup** regularly. The app stores data in browser local storage, so exporting a JSON backup is the reliable way to move or preserve the CRM state.
