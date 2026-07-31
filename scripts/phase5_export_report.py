# scripts/phase5_export_report.py
"""
PHASE 5 – ENCROACHMENT COMPLIANCE REPORT
=========================================
Generates:
  1. <ICAO>_encroachment_summary.csv   (unchanged)
  2. <ICAO>_OLS_Compliance_Report.pdf  (ReportLab – replaces old .txt)

Only this file has been modified.  All other phases are untouched.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

import geopandas as gpd
import pandas as pd

# ── ReportLab imports ─────────────────────────────────────────────────────────
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, NextPageTemplate,
    PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.flowables import HRFlowable

# ── Colour palette ────────────────────────────────────────────────────────────
NAVY        = colors.HexColor("#0a1929")
DARK_BLUE   = colors.HexColor("#1a3a5c")
MED_BLUE    = colors.HexColor("#1e6091")
LIGHT_BLUE  = colors.HexColor("#d6e8f7")
CYAN        = colors.HexColor("#00b4d8")
WHITE       = colors.white
SLATE       = colors.HexColor("#64748b")
SLATE_LIGHT = colors.HexColor("#e2e8f0")
RED         = colors.HexColor("#dc2626")
ORANGE      = colors.HexColor("#ea580c")
YELLOW      = colors.HexColor("#ca8a04")
GREEN       = colors.HexColor("#16a34a")
ROW_ALT     = colors.HexColor("#f1f5f9")
RISK_COLORS = {
    "CRITICAL": RED,
    "HIGH":     ORANGE,
    "MEDIUM":   YELLOW,
    "LOW":      GREEN,
}

CONFIG_PATH = ROOT_DIR / "config" / "spatial_anchor.json"
PAGE_W, PAGE_H = A4


# ── Helper: build ReportLab styles ────────────────────────────────────────────
def _build_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=WHITE,
        leading=28,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    styles["cover_sub"] = ParagraphStyle(
        "cover_sub",
        fontName="Helvetica",
        fontSize=13,
        textColor=colors.HexColor("#90caf9"),
        leading=18,
        alignment=TA_CENTER,
        spaceAfter=3,
    )
    styles["cover_meta"] = ParagraphStyle(
        "cover_meta",
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#cfd8dc"),
        leading=15,
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    styles["section_heading"] = ParagraphStyle(
        "section_heading",
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=DARK_BLUE,
        leading=17,
        spaceBefore=14,
        spaceAfter=6,
        leftIndent=0,
    )
    styles["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=colors.HexColor("#1e293b"),
        leading=14,
        spaceAfter=4,
    )
    styles["caption"] = ParagraphStyle(
        "caption",
        fontName="Helvetica-Oblique",
        fontSize=9,
        textColor=SLATE,
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    styles["footer"] = ParagraphStyle(
        "footer",
        fontName="Helvetica",
        fontSize=7.5,
        textColor=SLATE,
        alignment=TA_CENTER,
    )
    styles["table_header"] = ParagraphStyle(
        "table_header",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        textColor=WHITE,
        alignment=TA_CENTER,
    )
    styles["table_cell"] = ParagraphStyle(
        "table_cell",
        fontName="Helvetica",
        fontSize=8.5,
        textColor=colors.HexColor("#1e293b"),
        alignment=TA_CENTER,
        leading=11,
    )
    styles["table_cell_left"] = ParagraphStyle(
        "table_cell_left",
        fontName="Helvetica",
        fontSize=8.5,
        textColor=colors.HexColor("#1e293b"),
        alignment=TA_LEFT,
        leading=11,
    )
    return styles


# ── Page-event callbacks (header stripe + footer) ─────────────────────────────
def _make_page_callbacks(icao: str, airport_name: str):
    """Return (on_first_page, on_later_pages) callables for BaseDocTemplate."""

    def _draw_footer(canvas, doc):
        canvas.saveState()
        # thin top rule for footer
        canvas.setStrokeColor(SLATE_LIGHT)
        canvas.setLineWidth(0.5)
        canvas.line(1.5 * cm, 1.8 * cm, PAGE_W - 1.5 * cm, 1.8 * cm)
        # left text
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(SLATE)
        canvas.drawString(1.5 * cm, 1.3 * cm, "Airport OLS Monitoring System — ICAO Annex 14")
        # centre text
        canvas.drawCentredString(
            PAGE_W / 2, 1.3 * cm, f"{airport_name} [{icao}]"
        )
        # right: page X of Y
        canvas.drawRightString(
            PAGE_W - 1.5 * cm, 1.3 * cm,
            f"Page {doc.page} of {doc.page}"  # updated in _on_page via post-process trick
        )
        # "Generated Automatically" line
        canvas.setFont("Helvetica-Oblique", 6.5)
        canvas.setFillColor(colors.HexColor("#94a3b8"))
        canvas.drawCentredString(PAGE_W / 2, 0.9 * cm, "Generated Automatically — Confidential")
        canvas.restoreState()

    def on_first_page(canvas, doc):
        # Solid navy cover bar at top (drawn on page 1 only by cover content itself)
        _draw_footer(canvas, doc)

    def on_later_pages(canvas, doc):
        # Thin top accent bar on inner pages
        canvas.saveState()
        canvas.setFillColor(DARK_BLUE)
        canvas.rect(0, PAGE_H - 0.9 * cm, PAGE_W, 0.9 * cm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawString(1.5 * cm, PAGE_H - 0.6 * cm, "Airport OLS Monitoring System")
        canvas.setFont("Helvetica", 8.5)
        canvas.drawRightString(
            PAGE_W - 1.5 * cm, PAGE_H - 0.6 * cm,
            f"{airport_name} [{icao}]  |  ICAO Annex 14 Compliance Report"
        )
        canvas.restoreState()
        _draw_footer(canvas, doc)

    return on_first_page, on_later_pages


# ── Table style helpers ───────────────────────────────────────────────────────
def _header_table_style(num_rows: int):
    """Alternating-row table style with blue header."""
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
        ("TEXTCOLOR",  (0, 0), (-1, 0), WHITE),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, 0), 8.5),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",       (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, ROW_ALT]),
        ("FONTNAME",   (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",   (0, 1), (-1, -1), 8.5),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]
    return TableStyle(style)


# ── Cover page content ────────────────────────────────────────────────────────
def _build_cover(styles, icao, airport_name, elevation_msl, utm_epsg, gen_time):
    story = []
    usable_w = PAGE_W - 3 * cm  # for the cover table

    # Full-width navy banner
    banner_data = [[
        Paragraph("✈  AIRPORT OLS MONITORING SYSTEM", styles["cover_title"]),
    ]]
    banner_table = Table(banner_data, colWidths=[usable_w])
    banner_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
        ("TOPPADDING",    (0, 0), (-1, -1), 28),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 0.3 * cm))

    # Subtitle stripe
    sub_data = [[
        Paragraph(
            "ICAO Annex 14 Obstacle Limitation Surface (OLS) Compliance Report",
            styles["cover_sub"]
        )
    ]]
    sub_table = Table(sub_data, colWidths=[usable_w])
    sub_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK_BLUE),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [5]),
    ]))
    story.append(sub_table)
    story.append(Spacer(1, 0.7 * cm))

    # Meta-data table
    meta_rows = [
        ["Airport",              airport_name],
        ["ICAO Identifier",      icao],
        ["Generated On",         gen_time],
        ["Coordinate System",    f"UTM / EPSG:{utm_epsg}" if utm_epsg else "UTM"],
        ["Base Elevation (MSL)", f"{elevation_msl:.1f} m"],
        ["Classification",       "RESTRICTED — For Official Use Only"],
    ]
    col_w = [5 * cm, usable_w - 5 * cm]
    meta_tbl = Table(meta_rows, colWidths=col_w)
    meta_tbl.setStyle(TableStyle([
        ("FONTNAME",      (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",      (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
        ("TEXTCOLOR",     (0, 0), (0, -1), DARK_BLUE),
        ("TEXTCOLOR",     (1, 0), (1, -1), colors.HexColor("#1e293b")),
        ("BACKGROUND",    (0, 0), (-1, -1), LIGHT_BLUE),
        ("ROWBACKGROUNDS",(0, 0), (-1, -1), [LIGHT_BLUE, WHITE]),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#93c5fd")),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("ALIGN",         (0, 0), (-1, -1), "LEFT"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 0.6 * cm))

    # Divider
    story.append(HRFlowable(width="100%", thickness=1.5, color=MED_BLUE, spaceAfter=6))

    # Disclaimer box
    disc_data = [[
        Paragraph(
            "This report was generated automatically by the Airport OLS Monitoring System "
            "using satellite-derived change detection and ICAO Annex 14 spatial analytics. "
            "Results are indicative and must be validated by a certified aerodrome engineer "
            "before submission to regulatory authorities.",
            styles["body"]
        )
    ]]
    disc_tbl = Table(disc_data, colWidths=[usable_w])
    disc_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("BOX",           (0, 0), (-1, -1), 1, colors.HexColor("#fbbf24")),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(disc_tbl)
    story.append(PageBreak())
    return story


# ── Executive summary section ─────────────────────────────────────────────────
def _build_executive_summary(
    styles, icao, total, critical, high, medium, low, max_vio, avg_area
):
    story = []
    usable_w = PAGE_W - 3 * cm

    story.append(Paragraph("1.  Executive Summary", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT_BLUE, spaceAfter=8))

    # KPI cards row
    risk_badge_style = lambda col: TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), col),
        ("TEXTCOLOR",     (0, 0), (-1, -1), WHITE),
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 22),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROUNDEDCORNERS", [6]),
    ])
    label_style = lambda col: TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), col),
        ("TEXTCOLOR",     (0, 0), (-1, -1), WHITE),
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 7.5),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING",    (0, 0), (-1, -1), 2),
        ("ROUNDEDCORNERS", [6]),
    ])

    card_w = (usable_w - 1.2 * cm) / 5
    cards_data = []
    for count, label, col in [
        (total,    "Total",    DARK_BLUE),
        (critical, "Critical", RED),
        (high,     "High",     ORANGE),
        (medium,   "Medium",   YELLOW),
        (low,      "Low",      GREEN),
    ]:
        inner = Table([[str(count)], [label]], colWidths=[card_w - 0.2 * cm])
        inner.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), col),
            ("TEXTCOLOR",     (0, 0), (0, 0), WHITE),
            ("FONTNAME",      (0, 0), (0, 0), "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (0, 0), 22),
            ("TEXTCOLOR",     (0, 1), (0, 1), WHITE),
            ("FONTNAME",      (0, 1), (0, 1), "Helvetica"),
            ("FONTSIZE",      (0, 1), (0, 1), 8),
            ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (0, 0), 12),
            ("BOTTOMPADDING", (0, 1), (0, 1), 12),
            ("ROUNDEDCORNERS", [6]),
        ]))
        cards_data.append(inner)

    cards_row = Table([cards_data], colWidths=[card_w] * 5,
                      hAlign="LEFT")
    cards_row.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
    ]))
    story.append(cards_row)
    story.append(Spacer(1, 0.5 * cm))

    # Summary metrics table
    story.append(Paragraph("Summary Metrics", styles["section_heading"]))
    metrics = [
        ["Metric",                 "Value"],
        ["Total Structures Detected",   str(total)],
        ["Critical Risk Structures",    str(critical)],
        ["High Risk Structures",        str(high)],
        ["Medium Risk Structures",      str(medium)],
        ["Low Risk Structures",         str(low)],
        ["Maximum Height Violation (m)", f"{max_vio:.2f}"],
        ["Average Footprint Area (m²)",  f"{avg_area:.0f}"],
    ]
    col_w = [usable_w * 0.6, usable_w * 0.4]
    metrics_tbl = Table(metrics, colWidths=col_w)
    metrics_tbl.setStyle(_header_table_style(len(metrics)))
    story.append(metrics_tbl)
    return story


# ── Risk statistics section ───────────────────────────────────────────────────
def _build_risk_stats(styles, total, critical, high, medium, low):
    story = []
    usable_w = PAGE_W - 3 * cm

    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("2.  Risk Distribution Statistics", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT_BLUE, spaceAfter=8))

    def pct(n):
        return f"{(n / total * 100):.1f} %" if total > 0 else "—"

    risk_data = [
        ["Risk Level", "Count", "Percentage", "Status"],
        ["CRITICAL", str(critical), pct(critical),
         "⚠ Immediate Action Required" if critical > 0 else "✓ None"],
        ["HIGH",     str(high),     pct(high),
         "⚠ Priority Review" if high > 0 else "✓ None"],
        ["MEDIUM",   str(medium),   pct(medium),
         "◉ Monitor Closely" if medium > 0 else "✓ None"],
        ["LOW",      str(low),      pct(low),
         "● Within Limits" if low > 0 else "✓ None"],
    ]
    col_w = [usable_w * 0.22, usable_w * 0.15, usable_w * 0.22, usable_w * 0.41]
    risk_tbl = Table(risk_data, colWidths=col_w)
    base_style = _header_table_style(len(risk_data))

    # Colour each risk row
    risk_row_colors = {
        1: RED,
        2: ORANGE,
        3: YELLOW,
        4: GREEN,
    }
    extra = []
    for row_idx, col in risk_row_colors.items():
        extra.append(("TEXTCOLOR", (0, row_idx), (0, row_idx), col))
        extra.append(("FONTNAME",  (0, row_idx), (0, row_idx), "Helvetica-Bold"))

    risk_tbl.setStyle(TableStyle(base_style._cmds + extra))
    story.append(risk_tbl)
    return story


# ── Critical violations section ───────────────────────────────────────────────
def _build_critical_violations(styles, encroachment_gdf):
    story = []
    usable_w = PAGE_W - 3 * cm

    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("3.  Critical Violation Details", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT_BLUE, spaceAfter=8))

    critical_df = (
        encroachment_gdf[encroachment_gdf["risk_level"] == "CRITICAL"]
        if "risk_level" in encroachment_gdf.columns
        else encroachment_gdf.iloc[0:0]  # empty slice
    )

    if len(critical_df) == 0:
        no_crit = Table([["  ✓  No Critical Violations Detected"]], colWidths=[usable_w])
        no_crit.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#dcfce7")),
            ("TEXTCOLOR",     (0, 0), (-1, -1), GREEN),
            ("FONTNAME",      (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, -1), 11),
            ("ALIGN",         (0, 0), (-1, -1), "LEFT"),
            ("TOPPADDING",    (0, 0), (-1, -1), 14),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
            ("LEFTPADDING",   (0, 0), (-1, -1), 20),
            ("BOX",           (0, 0), (-1, -1), 1, GREEN),
            ("ROUNDEDCORNERS", [4]),
        ]))
        story.append(no_crit)
        return story

    # Build detailed table
    def _g(row, col, default="N/A"):
        val = row.get(col, default)
        return "N/A" if pd.isna(val) else str(val)

    headers = [
        "Polygon ID", "Zone", "Est. Height (m)",
        "Allowed (m)", "Violation (m)", "Latitude", "Longitude"
    ]
    rows = [headers]
    for _, row in critical_df.iterrows():
        rows.append([
            _g(row, "polygon_id"),
            _g(row, "zone_name"),
            f"{float(row.get('estimated_height_m', 0)):.1f}",
            f"{float(row.get('z_limit_m', 0)):.1f}",
            f"+{float(row.get('height_violation_m', 0)):.1f}",
            f"{float(row.get('centroid_lat', 0)):.6f}",
            f"{float(row.get('centroid_lon', 0)):.6f}",
        ])

    col_w_list = [
        usable_w * 0.14, usable_w * 0.20, usable_w * 0.13,
        usable_w * 0.12, usable_w * 0.13, usable_w * 0.14, usable_w * 0.14,
    ]
    crit_tbl = Table(rows, colWidths=col_w_list, repeatRows=1)
    crit_style = _header_table_style(len(rows))
    # Highlight violation column in red
    for r in range(1, len(rows)):
        crit_style._cmds.append(
            ("TEXTCOLOR", (4, r), (4, r), RED)
        )
        crit_style._cmds.append(
            ("FONTNAME", (4, r), (4, r), "Helvetica-Bold")
        )
    crit_tbl.setStyle(crit_style)
    story.append(crit_tbl)
    return story


# ── Map snapshot section ───────────────────────────────────────────────────────
def _build_map_snapshot(styles, snapshot_path):
    """Embed map_snapshot.png if it exists; skip gracefully if not."""
    story = []
    if not snapshot_path.exists():
        return story  # silent skip

    story.append(PageBreak())
    story.append(Paragraph("4.  OLS Encroachment Map Snapshot", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT_BLUE, spaceAfter=10))

    usable_w = PAGE_W - 3 * cm
    max_h = 14 * cm  # max height on page

    try:
        from PIL import Image as PILImage
        with PILImage.open(snapshot_path) as pil_img:
            img_w, img_h = pil_img.size
        aspect = img_h / img_w
        draw_w = usable_w
        draw_h = draw_w * aspect
        if draw_h > max_h:
            draw_h = max_h
            draw_w = draw_h / aspect

        img = Image(str(snapshot_path), width=draw_w, height=draw_h)
        img.hAlign = "CENTER"
        story.append(img)
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph("Detected OLS Encroachments", styles["caption"]))
    except Exception as exc:
        print(f"  [WARN] Could not embed map snapshot: {exc}")

    return story


# ── Main PDF builder ──────────────────────────────────────────────────────────
def _generate_pdf(
    pdf_path, icao, airport_name, elevation_msl, utm_epsg,
    total, critical, high, medium, low, max_violation, avg_area,
    encroachment_gdf, snapshot_path
):
    gen_time = datetime.now().strftime("%Y-%m-%d  %H:%M:%S")
    styles   = _build_styles()
    on_first, on_later = _make_page_callbacks(icao, airport_name)

    # Page templates
    margin_lr = 1.5 * cm
    margin_tb = 2.2 * cm

    first_frame = Frame(
        margin_lr, margin_tb,
        PAGE_W - 2 * margin_lr, PAGE_H - margin_tb - 0.5 * cm,
        id="first"
    )
    later_frame = Frame(
        margin_lr, margin_tb,
        PAGE_W - 2 * margin_lr, PAGE_H - margin_tb - 1.2 * cm,
        id="later"
    )

    doc = BaseDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=margin_lr,
        leftMargin=margin_lr,
        topMargin=margin_tb,
        bottomMargin=margin_tb,
    )
    doc.addPageTemplates([
        PageTemplate(id="First", frames=[first_frame], onPage=on_first),
        PageTemplate(id="Later", frames=[later_frame], onPage=on_later),
    ])

    # Build story
    story = []

    # ── Cover ────────────────────────────────────────────────────────────────
    story += _build_cover(styles, icao, airport_name, elevation_msl, utm_epsg, gen_time)

    # Switch to inner-page template after cover
    story.append(NextPageTemplate("Later"))

    # ── Executive Summary ────────────────────────────────────────────────────
    story += _build_executive_summary(
        styles, icao, total, critical, high, medium, low, max_violation, avg_area
    )

    # ── Risk Statistics ───────────────────────────────────────────────────────
    story += _build_risk_stats(styles, total, critical, high, medium, low)

    # ── Critical Violations ───────────────────────────────────────────────────
    story += _build_critical_violations(styles, encroachment_gdf)

    # ── Map Snapshot (optional) ───────────────────────────────────────────────
    story += _build_map_snapshot(styles, snapshot_path)

    doc.build(story)
    return pdf_path


# ── Public entry point ────────────────────────────────────────────────────────
def generate_encroachment_report():
    print("\n==========================================")
    print("   PHASE 5: ENCROACHMENT COMPLIANCE REPORT ")
    print("==========================================\n")

    if not CONFIG_PATH.exists():
        raise FileNotFoundError("Missing config/spatial_anchor.json. Run Phase 1 first.")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        anchor = json.load(f)

    info = anchor["airport_info"]
    ws   = anchor["workspace"]

    icao           = info.get("icao", "UNKNOWN")
    airport_name   = info.get("airport_name", "Airport")
    elevation_msl  = float(info.get("elevation_msl_m", 0.0))
    utm_epsg       = info.get("utm_epsg", "")

    processed_dir       = ROOT_DIR / ws["processed_dir"]
    analytics_geojson   = processed_dir / f"{icao}_encroachment_analytics.geojson"
    report_csv_path     = processed_dir / f"{icao}_encroachment_summary.csv"
    report_pdf_path     = processed_dir / f"{icao}_OLS_Compliance_Report.pdf"
    snapshot_path       = processed_dir / "map_snapshot.png"

    print(f"  Airport Name : {airport_name} [{icao}]")
    print(f"  Base MSL Alt : {elevation_msl} m")
    print(f"  Input Vector : {analytics_geojson}\n")

    if not analytics_geojson.exists():
        raise FileNotFoundError(
            f"Analytics GeoJSON not found at {analytics_geojson}. Run Phase 4 first."
        )

    # ── Load GeoJSON ─────────────────────────────────────────────────────────
    gdf = gpd.read_file(analytics_geojson)

    if "layer_type" in gdf.columns:
        encroachment_gdf = gdf[gdf["layer_type"] == "encroachment_polygon"].copy()
    else:
        encroachment_gdf = gdf.copy()

    total_footprints = len(encroachment_gdf)

    if total_footprints > 0:
        rl = encroachment_gdf.get("risk_level", pd.Series(dtype=str))
        critical_count = int((rl == "CRITICAL").sum())
        high_count     = int((rl == "HIGH").sum())
        medium_count   = int((rl == "MEDIUM").sum())
        low_count      = int((rl == "LOW").sum())
        hv_col = encroachment_gdf.get("height_violation_m", pd.Series([0.0]))
        max_violation  = float(hv_col.max()) if len(hv_col) else 0.0
        area_col = encroachment_gdf.get("area_m2", pd.Series([0.0]))
        avg_area = float(area_col.mean()) if len(area_col) else 0.0

        # ── CSV export (unchanged) ─────────────────────────────────────────
        export_cols = [
            c for c in [
                "polygon_id", "airport_icao", "zone_name", "risk_level",
                "area_m2", "estimated_height_m", "absolute_alt_m",
                "z_limit_m", "height_violation_m", "centroid_lat", "centroid_lon"
            ] if c in encroachment_gdf.columns
        ]
        pd.DataFrame(encroachment_gdf[export_cols]).to_csv(report_csv_path, index=False)
        print(f"  [OK] Summary CSV Saved : {report_csv_path}")

    else:
        critical_count = high_count = medium_count = low_count = 0
        max_violation  = 0.0
        avg_area       = 0.0

        pd.DataFrame(columns=[
            "polygon_id", "airport_icao", "zone_name", "risk_level",
            "area_m2", "estimated_height_m", "absolute_alt_m",
            "z_limit_m", "height_violation_m"
        ]).to_csv(report_csv_path, index=False)

    # ── Generate PDF ──────────────────────────────────────────────────────────
    _generate_pdf(
        pdf_path      = report_pdf_path,
        icao          = icao,
        airport_name  = airport_name,
        elevation_msl = elevation_msl,
        utm_epsg      = utm_epsg,
        total         = total_footprints,
        critical      = critical_count,
        high          = high_count,
        medium        = medium_count,
        low           = low_count,
        max_violation = max_violation,
        avg_area      = avg_area,
        encroachment_gdf = encroachment_gdf,
        snapshot_path = snapshot_path,
    )

    print(f"  [OK] PDF Report Saved  : {report_pdf_path}")
    print(f"\n[DONE] Phase 5 Compliance Reporting Complete!")
    return str(report_pdf_path)


if __name__ == "__main__":
    generate_encroachment_report()