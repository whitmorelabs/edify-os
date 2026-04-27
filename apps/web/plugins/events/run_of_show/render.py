"""
run_of_show/render.py

Generates a minute-by-minute event run-of-show as a landscape A4 PDF using
ReportLab. Designed for nonprofit galas, fundraisers, and programs.

Output columns: Time | Duration | Segment | Responsible | Tech/Setup Cue | Contingency
Footer: Key Contacts section.

All libraries are pre-installed in Anthropic's code-execution sandbox.
"""

import os
import re
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


# ---------------------------------------------------------------------------
# Color palette
# ---------------------------------------------------------------------------

_NAVY = colors.HexColor("#1A476B")
_STEEL = colors.HexColor("#2E729E")
_ROW_ALT = colors.HexColor("#F0F6FB")
_CONTACT_BG = colors.HexColor("#EAF2F8")
_GRAY = colors.HexColor("#555555")
_WHITE = colors.white
_BLACK = colors.black


# ---------------------------------------------------------------------------
# Style helpers
# ---------------------------------------------------------------------------

def _styles():
    base = getSampleStyleSheet()

    event_title = ParagraphStyle(
        "EventTitle",
        parent=base["Normal"],
        fontSize=16,
        fontName="Helvetica-Bold",
        textColor=_NAVY,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=base["Normal"],
        fontSize=10,
        fontName="Helvetica",
        textColor=_GRAY,
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    org = ParagraphStyle(
        "Org",
        parent=base["Normal"],
        fontSize=9,
        fontName="Helvetica-Oblique",
        textColor=_STEEL,
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    cell_normal = ParagraphStyle(
        "CellNormal",
        parent=base["Normal"],
        fontSize=8,
        fontName="Helvetica",
        textColor=_BLACK,
        alignment=TA_LEFT,
        leading=10,
    )
    cell_bold = ParagraphStyle(
        "CellBold",
        parent=base["Normal"],
        fontSize=8,
        fontName="Helvetica-Bold",
        textColor=_BLACK,
        alignment=TA_LEFT,
        leading=10,
    )
    col_header = ParagraphStyle(
        "ColHeader",
        parent=base["Normal"],
        fontSize=8,
        fontName="Helvetica-Bold",
        textColor=_WHITE,
        alignment=TA_CENTER,
        leading=10,
    )
    contact_label = ParagraphStyle(
        "ContactLabel",
        parent=base["Normal"],
        fontSize=9,
        fontName="Helvetica-Bold",
        textColor=_NAVY,
        alignment=TA_LEFT,
        spaceAfter=4,
    )
    contact_cell = ParagraphStyle(
        "ContactCell",
        parent=base["Normal"],
        fontSize=8,
        fontName="Helvetica",
        textColor=_BLACK,
        alignment=TA_LEFT,
        leading=10,
    )
    return {
        "event_title": event_title,
        "subtitle": subtitle,
        "org": org,
        "cell_normal": cell_normal,
        "cell_bold": cell_bold,
        "col_header": col_header,
        "contact_label": contact_label,
        "contact_cell": contact_cell,
    }


# ---------------------------------------------------------------------------
# Table builders
# ---------------------------------------------------------------------------

def _build_ros_table(segments: list, s: dict) -> Table:
    """Build the main run-of-show table."""
    col_headers = ["Time", "Duration", "Segment", "Responsible", "Tech / Setup Cue", "Contingency"]

    header_row = [Paragraph(h, s["col_header"]) for h in col_headers]

    rows = [header_row]
    for i, seg in enumerate(segments):
        time_val = str(seg.get("time", ""))
        duration_val = str(seg.get("duration", ""))
        segment_val = str(seg.get("segment", ""))
        responsible_val = str(seg.get("responsible", ""))
        tech_val = str(seg.get("tech_setup", ""))
        contingency_val = str(seg.get("contingency", ""))

        row = [
            Paragraph(time_val, s["cell_bold"]),
            Paragraph(duration_val, s["cell_normal"]),
            Paragraph(segment_val, s["cell_bold"]),
            Paragraph(responsible_val, s["cell_normal"]),
            Paragraph(tech_val, s["cell_normal"]),
            Paragraph(contingency_val, s["cell_normal"]),
        ]
        rows.append(row)

    # Column widths for landscape A4 (~27.7cm usable)
    # Time | Duration | Segment | Responsible | Tech/Setup | Contingency
    col_widths = [2.4 * cm, 2.0 * cm, 4.8 * cm, 4.4 * cm, 6.0 * cm, 5.6 * cm]

    table = Table(rows, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), _NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), _WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#C0C0C0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_WHITE, _ROW_ALT]),
        # Time column — bold navy text
        ("TEXTCOLOR", (0, 1), (0, -1), _NAVY),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ]

    table.setStyle(TableStyle(style_cmds))
    return table


def _build_contacts_table(contacts: list, s: dict) -> Table:
    """Build the key contacts footer table."""
    col_headers = ["Name", "Role", "Phone"]
    header_row = [Paragraph(h, s["col_header"]) for h in col_headers]
    rows = [header_row]

    for contact in contacts:
        row = [
            Paragraph(str(contact.get("name", "")), s["contact_cell"]),
            Paragraph(str(contact.get("role", "")), s["contact_cell"]),
            Paragraph(str(contact.get("phone", "")), s["contact_cell"]),
        ]
        rows.append(row)

    col_widths = [6.0 * cm, 7.0 * cm, 5.0 * cm]
    table = Table(rows, colWidths=col_widths)

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), _STEEL),
        ("TEXTCOLOR", (0, 0), (-1, 0), _WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#C0C0C0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_WHITE, _CONTACT_BG]),
    ]
    table.setStyle(TableStyle(style_cmds))
    return table


# ---------------------------------------------------------------------------
# Core render function
# ---------------------------------------------------------------------------

def render(
    event_name: str,
    event_date: str,
    venue: str,
    org_name: str,
    start_time: str,
    segments: list,
    key_contacts: Optional[list] = None,
    output_dir: str = "/mnt/user-data/outputs",
) -> str:
    """
    Generate a minute-by-minute event run-of-show as a landscape A4 PDF.

    Parameters
    ----------
    event_name : str
        Name of the event (e.g. "Spring Gala 2026")
    event_date : str
        Date of the event (e.g. "May 15, 2026")
    venue : str
        Venue name and address
    org_name : str
        Full name of the organization
    start_time : str
        Event start time (e.g. "6:00 PM")
    segments : list of dict
        Each dict must contain: time, duration, segment, responsible,
        tech_setup, contingency
    key_contacts : list of dict, optional
        Each dict: {name, role, phone}
    output_dir : str
        Directory to save the output file

    Returns
    -------
    str
        Absolute path to the generated PDF file
    """
    required = {
        "event_name": event_name,
        "event_date": event_date,
        "venue": venue,
        "org_name": org_name,
        "start_time": start_time,
    }
    for field, value in required.items():
        if not value or not str(value).strip():
            raise ValueError(f"{field} is required and cannot be empty")

    if not segments or not isinstance(segments, list):
        raise ValueError("segments is required and must be a non-empty list")

    key_contacts = key_contacts or []

    os.makedirs(output_dir, exist_ok=True)

    safe_name = re.sub(r"[^\w]+", "_", event_name)[:30].strip("_")
    safe_date = re.sub(r"[^\w]+", "_", event_date)[:15].strip("_")
    filename = f"run_of_show_{safe_name}_{safe_date}.pdf"
    out_path = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        out_path,
        pagesize=landscape(A4),
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title=f"Run of Show — {event_name}",
        author=org_name,
    )

    s = _styles()
    story = []

    # --- Header ---
    story.append(Paragraph(event_name, s["event_title"]))
    story.append(Paragraph(f"{event_date}  |  Doors / Start: {start_time}", s["subtitle"]))
    story.append(Paragraph(venue, s["subtitle"]))
    story.append(Paragraph(org_name, s["org"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=_STEEL, spaceAfter=8))

    # --- Run-of-show table ---
    story.append(_build_ros_table(segments, s))

    # --- Key contacts ---
    if key_contacts:
        story.append(Spacer(1, 0.5 * cm))
        story.append(HRFlowable(width="100%", thickness=1, color=_STEEL, spaceBefore=4, spaceAfter=6))
        story.append(Paragraph("KEY CONTACTS — DAY OF EVENT", s["contact_label"]))
        story.append(_build_contacts_table(key_contacts, s))

    doc.build(story)
    return out_path
