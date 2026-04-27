---
name: sponsor_package
description: Build a sponsorship prospectus and 3 outreach email templates (cold, warm, last-chance) as a single Word document — cover page, event overview, mission statement, sponsor tier table, and ready-to-send emails. Designed for nonprofit galas, fundraisers, and programs.
---

# Sponsor Package

## When to use
Invoke `sponsor_package` when the Events Director user needs to recruit sponsors. Triggers include: "create a sponsorship package for [event]", "draft our sponsor prospectus", "write the sponsorship tiers for [gala]", "we need to reach out to sponsors", or "put together the sponsor deck". This skill produces a Word doc — not a chat summary.

Do not use for post-event reporting (use `post_event_report`) or day-of logistics (use `run_of_show`).

## Inputs

- `event_name` *(required, string)* — Name of the event. Example: "Spring Gala 2026"
- `event_date` *(required, string)* — Date of the event. Example: "May 15, 2026"
- `org_name` *(required, string)* — Full name of the organization
- `org_mission` *(required, string)* — 1-2 sentence mission statement
- `event_purpose` *(required, string)* — What the event is for, who it serves, what the fundraising goal is
- `fundraising_goal` *(required, string)* — Dollar goal for the event. Example: "$150,000"
- `venue` *(optional, string)* — Venue name and address
- `attendee_estimate` *(optional, integer or string)* — Expected attendance
- `sponsor_tiers` *(required, list of objects)* — Each object:
  ```json
  {
    "name": "Title Sponsor",
    "amount": 25000,
    "benefits": ["Logo on event banner", "Premier table for 10", "30-second speaking slot"]
  }
  ```
- `signer_name` *(required, string)* — Name of the contact signing the package
- `signer_title` *(required, string)* — Title of the signer (e.g. "Director of Events", "Development Director")

## Output

`sponsor_package_<event>_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

The document contains:
1. **Cover page** — event name, date, "Sponsorship Opportunities"
2. **About the Event** — 1 paragraph + key facts (date, venue, attendance, goal)
3. **About [Org Name]** — mission + impact stats placeholder
4. **Why Sponsor** — 3 bullet points: visibility, mission alignment, community
5. **Sponsor Tiers** — table: Tier | Amount | Benefits
6. **Logo + Recognition** — placeholder for designer
7. **Contact / Next Steps** — signer info and deadline note
8. **Outreach Email Templates** (page break, 3 variants):
   - **Cold outreach** — formal intro to org + event
   - **Warm outreach** — existing relationship reference
   - **Last-chance follow-up** — 1-week reminder before deadline

## Example invocation

```json
{
  "skill": "sponsor_package",
  "inputs": {
    "event_name": "Spring Gala 2026",
    "event_date": "May 15, 2026",
    "venue": "The Grand Ballroom, 100 Main St, Austin TX",
    "org_name": "Bridgepoint Futures",
    "org_mission": "Bridgepoint Futures empowers young adults with developmental disabilities to achieve economic independence and community belonging through workforce development and life skills training.",
    "event_purpose": "Our annual Spring Gala raises funds to support our Pathways to Work workforce readiness program, connecting 50+ youth to meaningful employment each year. This year we are raising $150,000 to expand our reach to two new employer partner sites.",
    "fundraising_goal": "$150,000",
    "attendee_estimate": 250,
    "sponsor_tiers": [
      {
        "name": "Title Sponsor",
        "amount": 25000,
        "benefits": [
          "Logo on event banner and all printed materials",
          "Premier table for 10 with preferred seating",
          "30-second speaking slot during program",
          "Full-page ad in event program",
          "Social media recognition (5 posts pre-event)",
          "Logo on organization website for 12 months"
        ]
      },
      {
        "name": "Gold Sponsor",
        "amount": 10000,
        "benefits": [
          "Logo in event program",
          "Table for 8",
          "Half-page ad in event program",
          "Social media recognition (3 posts)",
          "Logo on event signage"
        ]
      },
      {
        "name": "Silver Sponsor",
        "amount": 5000,
        "benefits": [
          "4 tickets to the event",
          "Quarter-page ad in event program",
          "Logo on event signage",
          "Social media recognition (1 post)"
        ]
      },
      {
        "name": "Community Sponsor",
        "amount": 2500,
        "benefits": [
          "2 tickets to the event",
          "Name in event program",
          "Social media recognition"
        ]
      }
    ],
    "signer_name": "Jordan Lee",
    "signer_title": "Director of Events"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `event_name`, `event_date`, `org_name`, `org_mission`, `event_purpose`, `fundraising_goal`, `sponsor_tiers`, `signer_name`, and `signer_title` before calling.

After the skill produces the file, present it as a downloadable artifact. Remind the user to:
- Add the organization logo to the cover page before sending
- Fill in real impact statistics in the "About [Org Name]" section
- Set a firm sponsor deadline in the Next Steps section (4-6 weeks out is standard)
- Have leadership sign off on tier amounts before outreach begins
