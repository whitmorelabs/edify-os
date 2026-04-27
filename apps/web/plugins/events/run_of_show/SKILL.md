---
name: run_of_show
description: Generate a minute-by-minute event run-of-show as a landscape PDF — columns for time, duration, segment, responsible party, tech/setup cue, and contingency — plus a key contacts section at the footer. Designed for nonprofit galas, fundraisers, and programs.
---

# Run of Show

## When to use
Invoke `run_of_show` when the Events Director user needs a day-of flow document. Triggers include: "build a run of show for [event]", "create the minute-by-minute for our gala", "I need the event flow document", "draft a run of show", or "what's the schedule for the event". This skill produces a formatted landscape PDF — not a chat table.

Do not use for multi-week event timelines (use the planner skill) or sponsorship packages (use `sponsor_package`).

## Inputs

- `event_name` *(required, string)* — Name of the event. Example: "Spring Gala 2026"
- `event_date` *(required, string)* — Date of the event. Example: "May 15, 2026"
- `venue` *(required, string)* — Venue name and address. Example: "The Grand Ballroom, 100 Main St, Austin TX"
- `org_name` *(required, string)* — Full name of the organization
- `start_time` *(required, string)* — First event start time. Example: "6:00 PM"
- `segments` *(required, list of objects)* — Each object:
  ```json
  {
    "time": "6:00 PM",
    "duration": "30 min",
    "segment": "Cocktail reception",
    "responsible": "Event manager + bartenders",
    "tech_setup": "Background music, ambient lighting",
    "contingency": "Move indoors if rain"
  }
  ```
- `key_contacts` *(optional, list of objects)* — Emergency-day staff/vendors:
  ```json
  [{"name": "Jordan Lee", "role": "Event Manager", "phone": "512-555-0100"}]
  ```

## Output

`run_of_show_<event>_<date>.pdf` saved to `/mnt/user-data/outputs/`.

The document (landscape A4 PDF) contains:
1. **Header** — event name, date, venue, org name
2. **Run-of-Show Table** — columns: Time | Duration | Segment | Responsible | Tech/Setup Cue | Contingency. One row per segment.
3. **Key Contacts Footer** — emergency-day contacts table (Name | Role | Phone)

## Example invocation

```json
{
  "skill": "run_of_show",
  "inputs": {
    "event_name": "Spring Gala 2026",
    "event_date": "May 15, 2026",
    "venue": "The Grand Ballroom, 100 Main St, Austin TX",
    "org_name": "Bridgepoint Futures",
    "start_time": "6:00 PM",
    "segments": [
      {
        "time": "6:00 PM",
        "duration": "30 min",
        "segment": "Cocktail reception",
        "responsible": "Event manager + bartenders",
        "tech_setup": "Background music at 40% volume, amber ambient lighting",
        "contingency": "Move indoors if rain forecast"
      },
      {
        "time": "6:30 PM",
        "duration": "15 min",
        "segment": "Doors open to dining room",
        "responsible": "Floor captain",
        "tech_setup": "House lights up, centerpieces lit",
        "contingency": "Hold 5 min if cocktail crowd not ready"
      },
      {
        "time": "6:45 PM",
        "duration": "10 min",
        "segment": "Welcome remarks",
        "responsible": "Executive Director",
        "tech_setup": "Podium mic check, spotlight on stage",
        "contingency": "Backup wireless mic on podium"
      },
      {
        "time": "6:55 PM",
        "duration": "45 min",
        "segment": "Dinner service",
        "responsible": "Catering team lead",
        "tech_setup": "Soft background music, house lights at 60%",
        "contingency": "Alert ED if course timing runs 10+ min behind"
      },
      {
        "time": "7:40 PM",
        "duration": "20 min",
        "segment": "Program + impact video",
        "responsible": "AV technician + MC",
        "tech_setup": "Screen down, projector on, house lights at 20%",
        "contingency": "Print script for MC if AV fails"
      },
      {
        "time": "8:00 PM",
        "duration": "15 min",
        "segment": "Fund-a-Need appeal",
        "responsible": "Auctioneer + Development Director",
        "tech_setup": "Handheld mic ready, bidder paddles distributed",
        "contingency": "Manual bid tracking sheet at registration"
      },
      {
        "time": "8:15 PM",
        "duration": "45 min",
        "segment": "Live music + dancing",
        "responsible": "Band leader",
        "tech_setup": "Stage setup complete, dance floor cleared",
        "contingency": "Playlist backup if band technical issues"
      },
      {
        "time": "9:00 PM",
        "duration": "15 min",
        "segment": "Dessert + raffle drawing",
        "responsible": "Events team",
        "tech_setup": "House lights up slightly for drawing",
        "contingency": "Pre-verify winner list before announcing"
      },
      {
        "time": "9:15 PM",
        "duration": "30 min",
        "segment": "Farewell + guest departure",
        "responsible": "Floor captain + valet",
        "tech_setup": "Lobby lights up, valet queue open",
        "contingency": "Extra staff at coat check if high volume"
      }
    ],
    "key_contacts": [
      {"name": "Jordan Lee", "role": "Event Manager", "phone": "512-555-0100"},
      {"name": "Marcus T.", "role": "AV Lead", "phone": "512-555-0177"},
      {"name": "Priya Shah", "role": "Catering Contact", "phone": "512-555-0199"},
      {"name": "Sam Rivera", "role": "Executive Director", "phone": "512-555-0150"}
    ]
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `event_name`, `event_date`, `venue`, `org_name`, `start_time`, and `segments` before calling. `key_contacts` is optional but strongly recommended for day-of use.

After the skill produces the file, present it as a downloadable PDF artifact. Remind the user to:
- Share with all responsible parties 48 hours before the event
- Print hard copies for key staff — never rely on phones alone day-of
- Review contingency plans with the team at the walk-through
