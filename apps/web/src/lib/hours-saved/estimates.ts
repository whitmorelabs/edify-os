/**
 * Minutes saved per event, based on typical knowledge-worker time-to-complete
 * without AI assistance. Intentionally conservative.
 *
 * These values are version-controlled here (not in the DB) so they can be
 * tuned in a follow-up PR without a data migration. The API multiplies
 * count × minutesSaved(event_key) at read time.
 *
 * Event key format: "tool:<actual_tool_name>" where tool_name matches the
 * Anthropic tool `name` field as defined in apps/web/src/lib/tools/*.ts.
 *
 * First-pass estimates shipped 2026-04-23 (feat(stats): hours-saved counter).
 */
export const TIME_SAVED_ESTIMATES_MINUTES = {
  // Gmail
  "tool:gmail_send_message": 15,   // drafting + reviewing + sending an email
  "tool:gmail_create_draft": 12,   // drafting + saving a draft
  "tool:gmail_list_messages": 3,   // scanning inbox
  "tool:gmail_get_message": 2,     // reading a specific email
  "tool:gmail_list_threads": 3,    // browsing threads
  "tool:gmail_get_thread": 2,      // reading a thread
  "tool:gmail_modify_labels": 2,   // organizing email
  "tool:gmail_list_labels": 1,     // label lookup

  // Google Calendar
  "tool:calendar_create_event": 5,  // scheduling + invitee lookup
  "tool:calendar_list_events": 2,   // checking availability
  "tool:calendar_get_event": 1,     // reading an event
  "tool:calendar_update_event": 4,  // rescheduling / editing
  "tool:calendar_delete_event": 2,  // removing an event

  // Grants
  "tool:grants_search": 45,         // reading Grants.gov manually, filtering
  "tool:grants_get_details": 15,    // reading full opportunity docs

  // Nonprofit / funder due diligence (ProPublica)
  "tool:nonprofit_search": 30,        // researching funders + peer orgs by hand
  "tool:nonprofit_get_details": 25,   // pulling 990 financials + giving history

  // Federal awards history (USAspending.gov)
  "tool:usaspending_search_awards": 30,       // sifting USAspending.gov manually for landscape
  "tool:usaspending_recipient_profile": 25,   // recipient-by-recipient drill-down

  // California Grants Portal (data.ca.gov CKAN)
  "tool:ca_grants_search": 20,        // browsing CA portal manually + filtering
  "tool:ca_grants_get_details": 8,    // reading one grant's full record

  // Charity Navigator (free-tier GraphQL — ratings + accountability)
  "tool:charity_navigator_search": 25,   // peer org research + rating lookup by hand
  "tool:charity_navigator_profile": 20,  // reading one org's full CN ratings page

  // Candid Demographics (free DEI / leadership / board data)
  "tool:candid_demographics_get": 15,    // DEI lookup, often impossible by hand

  // Foundation grants paid (990-PF Schedule I parser — funder→recipient graph)
  "tool:foundation_grants_paid_by_ein": 60,  // pulling Schedule I from a 990-PF PDF by hand is brutal

  // Federal Register (NOFOs — primary signal, often before Grants.gov posts the structured opportunity)
  "tool:federal_register_search_grants": 25, // manually scanning Federal Register PDFs is brutal

  // Inside Philanthropy RSS (foundation news / signal — not structured opportunities)
  "tool:inside_philanthropy_recent": 15,     // skim newsletter equivalent

  // Grant matcher (the headline Dev Director tool — does the work of an entire grant-research session)
  // Aggregates all sources, applies hard filters, runs Claude judge, returns ranked top 12 with citations.
  "tool:find_grants_for_org": 240,           // 4 hours: full prospect-research session by hand

  // CRM
  "tool:crm_log_interaction": 8,    // updating a donor record manually
  "tool:crm_list_donors": 3,        // searching donor list
  "tool:crm_get_donor": 2,          // reading a donor profile
  "tool:crm_create_donor": 10,      // entering a new donor record
  "tool:crm_log_donation": 6,       // recording a donation

  // Design / Render
  "tool:render_design_to_image": 30, // designing a social graphic

  // Social
  "tool:social_post": 15,            // crafting + scheduling a post

  // Unsplash
  "tool:search_stock_photo": 5,      // photo search

  // Drive
  "tool:drive_create_file": 20,      // drafting a Google Doc from scratch
  "tool:drive_list_files": 2,
  "tool:drive_search_files": 3,
  "tool:drive_get_file": 2,
  "tool:drive_download_content": 3,
  "tool:drive_share_file": 3,

  // Skills (document generation — tracked via collectFileOutput)
  "skill:docx": 45,    // drafting a Word doc
  "skill:xlsx": 30,    // building a spreadsheet from raw data
  "skill:pptx": 60,    // building a presentation deck
  "skill:pdf": 20,     // generating a formatted PDF

  // Chat turn with no tools
  "chat:turn_no_tools": 5, // avg knowledge-worker task asked in natural language

  // Heartbeat proactive check-ins
  "heartbeat:daily_brief": 10,  // skimming calendar + email yourself
} as const;

export type EventKey = keyof typeof TIME_SAVED_ESTIMATES_MINUTES;

/**
 * Returns the minutes saved for a given event key.
 * Returns 0 for unknown keys (unknown events are not counted).
 */
export function minutesSaved(eventKey: string): number {
  return (TIME_SAVED_ESTIMATES_MINUTES as Record<string, number>)[eventKey] ?? 0;
}
