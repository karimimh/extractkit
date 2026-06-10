from __future__ import annotations

import csv
import io
import json
import zipfile
from pathlib import Path
from typing import Any
from uuid import uuid4
from xml.sax.saxutils import escape

from django.conf import settings


class TabularExportError(Exception):
    """Raised when CSV or Excel generation fails."""


def _scalar(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return str(value)


def _flatten(value: dict[str, Any], prefix: str = "") -> dict[str, str]:
    row: dict[str, str] = {}
    for key, item in value.items():
        column = f"{prefix}.{key}" if prefix else str(key)
        if isinstance(item, dict):
            row.update(_flatten(item, column))
        else:
            row[column] = _scalar(item)
    return row


def records_from_data(data: dict[str, Any]) -> list[dict[str, str]]:
    """Choose the most useful repeated records from structured extraction data."""
    tables = data.get("tables")
    if isinstance(tables, list):
        for table in tables:
            if not isinstance(table, dict):
                continue
            rows = table.get("rows")
            headers = table.get("headers")
            if isinstance(rows, list) and rows:
                if isinstance(headers, list) and rows and rows[0] == headers:
                    rows = rows[1:]
                width = max((len(row) for row in rows if isinstance(row, list)), default=0)
                names = [
                    str(headers[index]).strip() if isinstance(headers, list) and index < len(headers) and str(headers[index]).strip()
                    else f"column_{index + 1}"
                    for index in range(width)
                ]
                return [
                    {names[index]: _scalar(cell) for index, cell in enumerate(row)}
                    for row in rows
                    if isinstance(row, list)
                ]

    for value in data.values():
        if isinstance(value, list) and value and all(isinstance(item, dict) for item in value):
            return [_flatten(item) for item in value]

    return [_flatten(data)]


def _columns(rows: list[dict[str, str]]) -> list[str]:
    columns: list[str] = []
    for row in rows:
        for key in row:
            if key not in columns:
                columns.append(key)
    return columns or ["value"]


def _safe_spreadsheet_value(value: Any) -> str:
    text = _scalar(value)
    if text.startswith(("=", "+", "-", "@")):
        text = f"'{text}"
    text = "".join(
        character
        for character in text
        if character in "\t\n\r" or ord(character) >= 32
    )
    return text[:32_767]


def build_csv(data: dict[str, Any]) -> bytes:
    rows = records_from_data(data)
    columns = _columns(rows)
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({key: _safe_spreadsheet_value(row.get(key, "")) for key in columns})
    return output.getvalue().encode("utf-8-sig")


def _excel_sheets(data: dict[str, Any]) -> list[tuple[str, list[dict[str, str]]]]:
    sheets: list[tuple[str, list[dict[str, str]]]] = [("Records", records_from_data(data))]

    metadata = data.get("metadata")
    if isinstance(metadata, dict):
        page_fields = {
            key: data.get(key, "")
            for key in ("source_url", "title", "author", "date")
            if key in data
        }
        page_fields.update(metadata)
        sheets.append(("Metadata", [{"field": key, "value": _scalar(value)} for key, value in page_fields.items()]))

    for name, key in (("Links", "links"), ("Images", "images")):
        value = data.get(key)
        if isinstance(value, list) and value and all(isinstance(item, dict) for item in value):
            sheets.append((name, [_flatten(item) for item in value]))

    tables = data.get("tables")
    if isinstance(tables, list):
        table_rows: list[dict[str, str]] = []
        for table_index, table in enumerate(tables, 1):
            if not isinstance(table, dict):
                continue
            headers = table.get("headers") if isinstance(table.get("headers"), list) else []
            rows = table.get("rows", [])
            if headers and rows and rows[0] == headers:
                rows = rows[1:]
            for row_index, row in enumerate(rows, 1):
                if not isinstance(row, list):
                    continue
                record = {"table": str(table_index), "caption": _scalar(table.get("caption")), "row": str(row_index)}
                for index, cell in enumerate(row):
                    column = str(headers[index]).strip() if index < len(headers) and str(headers[index]).strip() else f"column_{index + 1}"
                    record[column] = _scalar(cell)
                table_rows.append(record)
        if table_rows:
            sheets.append(("Tables", table_rows))

    return sheets


def _column_name(index: int) -> str:
    name = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        name = chr(65 + remainder) + name
    return name


def _sheet_xml(rows: list[dict[str, str]]) -> str:
    columns = _columns(rows)
    all_rows = [dict(zip(columns, columns)), *rows]
    xml_rows: list[str] = []
    for row_index, row in enumerate(all_rows, 1):
        cells: list[str] = []
        for column_index, column in enumerate(columns, 1):
            value = escape(_safe_spreadsheet_value(row.get(column, "")))
            style = ' s="1"' if row_index == 1 else ""
            cells.append(
                f'<c r="{_column_name(column_index)}{row_index}" t="inlineStr"{style}>'
                f'<is><t xml:space="preserve">{value}</t></is></c>'
            )
        xml_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')
    end = f"{_column_name(len(columns))}{len(all_rows)}"
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<dimension ref="A1:{end}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews>'
        f'<sheetData>{"".join(xml_rows)}</sheetData><autoFilter ref="A1:{_column_name(len(columns))}1"/>'
        '</worksheet>'
    )


def build_xlsx(data: dict[str, Any]) -> bytes:
    sheets = _excel_sheets(data)
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as workbook:
        workbook.writestr("[Content_Types].xml", _content_types(len(sheets)))
        workbook.writestr("_rels/.rels", _root_relationships())
        workbook.writestr("xl/workbook.xml", _workbook_xml(sheets))
        workbook.writestr("xl/_rels/workbook.xml.rels", _workbook_relationships(len(sheets)))
        workbook.writestr("xl/styles.xml", _styles_xml())
        for index, (_name, rows) in enumerate(sheets, 1):
            workbook.writestr(f"xl/worksheets/sheet{index}.xml", _sheet_xml(rows))
    return output.getvalue()


def write_tabular_export(title: str, data: dict[str, Any], export_format: str) -> str:
    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    extension = "csv" if export_format == "csv" else "xlsx"
    filename = f"{extension}_{uuid4().hex}.{extension}"
    payload = build_csv(data) if export_format == "csv" else build_xlsx(data)
    (exports_dir / filename).write_bytes(payload)
    return f"exports/{filename}"


def _content_types(sheet_count: int) -> str:
    sheets = "".join(
        f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for i in range(1, sheet_count + 1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        f"{sheets}</Types>"
    )


def _root_relationships() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '</Relationships>'
    )


def _workbook_xml(sheets: list[tuple[str, list[dict[str, str]]]]) -> str:
    entries = "".join(
        f'<sheet name="{escape(name)}" sheetId="{index}" r:id="rId{index}"/>'
        for index, (name, _rows) in enumerate(sheets, 1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f"<sheets>{entries}</sheets></workbook>"
    )


def _workbook_relationships(sheet_count: int) -> str:
    entries = "".join(
        f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>'
        for i in range(1, sheet_count + 1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f'{entries}<Relationship Id="rId{sheet_count + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        '</Relationships>'
    )


def _styles_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<fonts count="2"><font/><font><b/></font></fonts>'
        '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
        '<borders count="1"><border/></borders>'
        '<cellStyleXfs count="1"><xf/></cellStyleXfs>'
        '<cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs>'
        '</styleSheet>'
    )
