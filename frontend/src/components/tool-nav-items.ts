import { Bell, Braces, Camera, FileCode, FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { CHANGE_MONITORING_ENABLED } from "../lib/features";

export const CONVERSION_TOOLS = [
  { to: "/web-to-pdf", label: "Website to PDF Converter", icon: FileText },
  { to: "/web-to-markdown", label: "Website to Markdown Converter", icon: FileCode },
  { to: "/web-to-json", label: "Website to JSON Converter", icon: Braces },
  { to: "/web-to-csv", label: "Website to CSV Converter", icon: Table2 },
  { to: "/web-to-excel", label: "Website to Excel Converter", icon: FileSpreadsheet },
  { to: "/web-to-screenshot", label: "Website Screenshot Generator", icon: Camera },
];

export const AUTOMATION_TOOLS = CHANGE_MONITORING_ENABLED
  ? [{ to: "/change-monitoring", label: "Website Change Monitor", icon: Bell }]
  : [];

export const WEB_TOOLS = [...CONVERSION_TOOLS, ...AUTOMATION_TOOLS];
