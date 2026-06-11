import { Bell, Braces, Camera, FileCode, FileSpreadsheet, FileText, Globe2, Table2 } from "lucide-react";

export const CONVERSION_TOOLS = [
  { to: "/web-to-pdf", label: "Webpage to PDF", icon: FileText },
  { to: "/web-to-markdown", label: "Webpage to Markdown", icon: FileCode },
  { to: "/web-to-json", label: "Webpage to JSON", icon: Braces },
  { to: "/web-to-csv", label: "Webpage to CSV", icon: Table2 },
  { to: "/web-to-excel", label: "Webpage to Excel", icon: FileSpreadsheet },
  { to: "/web-to-screenshot", label: "Webpage to Screenshot", icon: Camera },
  { to: "/website-bulk-export", label: "Website Bulk Export", icon: Globe2 },
];

export const AUTOMATION_TOOLS = [
  { to: "/change-monitoring", label: "Webpage Monitoring", icon: Bell },
];

export const WEB_TOOLS = [...CONVERSION_TOOLS, ...AUTOMATION_TOOLS];
