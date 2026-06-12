import { Bell, Braces, Camera, FileCode, FileSpreadsheet, FileText, Globe2, Table2 } from "lucide-react";

export const CONVERSION_TOOLS = [
  { to: "/web-to-pdf", label: "Website to PDF Converter", icon: FileText },
  { to: "/web-to-markdown", label: "Website to Markdown Converter", icon: FileCode },
  { to: "/web-to-json", label: "Website to JSON Converter", icon: Braces },
  { to: "/web-to-csv", label: "Website to CSV Converter", icon: Table2 },
  { to: "/web-to-excel", label: "Website to Excel Converter", icon: FileSpreadsheet },
  { to: "/web-to-screenshot", label: "Website Screenshot Generator", icon: Camera },
  { to: "/website-bulk-export", label: "Website Bulk Export", icon: Globe2 },
];

export const AUTOMATION_TOOLS = [
  { to: "/change-monitoring", label: "Website Change Monitor", icon: Bell },
];

export const WEB_TOOLS = [...CONVERSION_TOOLS, ...AUTOMATION_TOOLS];
