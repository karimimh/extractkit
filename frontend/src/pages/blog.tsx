import { Link, Navigate, useParams } from "react-router-dom";
import { usePageSeo } from "../hooks/use-page-seo";

type ArticleSection = {
  heading: string;
  body: string[];
};

type Article = {
  slug: string;
  title: string;
  description: string;
  canonical: string;
  toolName: string;
  toolPath: string;
  publishedAt: string;
  updatedAt: string;
  intro: string;
  sections: ArticleSection[];
};

const ARTICLES: Article[] = [
  {
    slug: "custom-pdf-from-webpage",
    title: "How to Create a Custom PDF from a Webpage",
    description:
      "Learn how to turn any webpage into a custom PDF using AI Cleanup, full-page export, or manual interaction.",
    canonical: "https://distillpage.com/blog/custom-pdf-from-webpage",
    toolName: "Web to PDF",
    toolPath: "/web-to-pdf",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "Saving a webpage as a PDF is easy until the page includes sticky headers, cookie banners, ads, sidebars, or chat widgets. DistillPage lets you use AI Cleanup, export the full page, or manually control the page before the final PDF.",
    sections: [
      {
        heading: "When a normal browser PDF is not enough",
        body: [
          "Browser print tools are useful for simple pages, but they often capture the page exactly as it is served. That means promotional banners, newsletter popups, floating buttons, and unrelated navigation can end up in the file.",
          "DistillPage provides three cleanup methods. Full Page export keeps the page unchanged. AI Cleanup asks OpenAI to identify page chrome and interruptions while preserving the primary content. Manual Interaction opens an interactive preview where you can browse, expand content, and click exactly what should be removed.",
        ],
      },
      {
        heading: "AI Cleanup or Manual Interaction",
        body: [
          "AI Cleanup is useful when you want a clean result quickly or need to process several pages with unfamiliar HTML structures. It analyzes the page content and structure instead of relying only on known class names.",
          "Manual Interaction is the default for single-page exports because it gives you direct control. Use it when the page has interactive sections to open, when a useful sidebar should remain, or when you need an exact visual result.",
        ],
      },
      {
        heading: "What to remove before exporting",
        body: [
          "Start with anything that distracts from the main content: cookie notices, ad blocks, sticky headers, sidebars, social share bars, chat launchers, and footer modules. For long pages, also check whether accordions, tabs, or menus need to be opened before capture.",
          "This is especially helpful for research, receipts, product documentation, articles, pricing pages, and reference pages where you want a clean archived copy instead of a noisy screenshot of the whole site chrome.",
        ],
      },
      {
        heading: "Screen layout or print layout",
        body: [
          "Some pages have a dedicated print stylesheet, while others look better in their screen layout. DistillPage lets you choose the layout mode before generating the PDF, so you can keep the version that preserves the content most accurately.",
          "If the page has complex columns or interactive sections, preview it first and compare the result. The goal is not just to save a page, but to create a readable PDF that still looks intentional.",
        ],
      },
      {
        heading: "How to make the PDF",
        body: [
          "Open the Web to PDF tool, paste the URL, and choose Full Page export, AI Cleanup, or Manual Interaction. With Manual Interaction, use the preview to browse and remove elements. Then choose the layout mode and export. Bulk mode supports Full Page export and AI Cleanup.",
        ],
      },
    ],
  },
  {
    slug: "remove-elements-before-website-screenshot",
    title: "How to Capture a Full Page Website Screenshot Without Clutter",
    description:
      "Capture a clean website screenshot using AI Cleanup, full-page export, or manual interaction before saving the image.",
    canonical: "https://distillpage.com/blog/remove-elements-before-website-screenshot",
    toolName: "Web to Screenshot",
    toolPath: "/web-to-screenshot",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "A website screenshot should show the page you care about, not every floating banner and overlay the site decides to add. DistillPage offers AI Cleanup, Full Page export, and Manual Interaction before capture.",
    sections: [
      {
        heading: "Why full-page screenshots need cleanup",
        body: [
          "Most screenshot tools capture the visible page state. If a popup, cookie prompt, support widget, sticky menu, or ad is present, it becomes part of the final image. On long pages, repeated sticky elements can make the screenshot feel messy or misleading.",
          "Use AI Cleanup when you want OpenAI to identify common interruptions automatically. Use Full Page export when every element should remain. Manual Interaction, the default for single-page captures, lets you browse the page and click away only the elements you do not want.",
        ],
      },
      {
        heading: "Choose the right cleanup method",
        body: [
          "AI Cleanup works well for quick captures and unfamiliar websites because it evaluates the DOM structure, labels, and visible text. It can identify navigation, ads, cookie prompts, popups, footers, and unrelated sidebars even when the site uses custom class names.",
          "Manual Interaction is better for design review and QA where the exact page state matters. Open tabs, expand accordions, preserve useful controls, and remove only the elements that should not appear in the evidence.",
        ],
      },
      {
        heading: "Choosing the right viewport",
        body: [
          "A page can look very different on mobile, tablet, desktop, and wide screens. If you are documenting responsive design, QA issues, marketing pages, or competitor layouts, choosing the viewport width matters.",
          "The Web to Screenshot tool supports common viewport widths so the image matches the context you need. Use mobile for narrow layouts, desktop for standard web captures, and wide mode when the design uses more horizontal space.",
        ],
      },
      {
        heading: "Good screenshot cleanup targets",
        body: [
          "Remove anything that blocks content or changes the visual story: cookie banners, modals, newsletter forms, floating share buttons, chat bubbles, sticky sale banners, and irrelevant navigation. Keep elements that explain the page state, such as selected filters or opened menus.",
          "For design review or QA, capture the page after interacting with it. Open tabs, expand accordions, accept required prompts, and then remove only the pieces that should not be part of the evidence.",
        ],
      },
      {
        heading: "How to capture the clean screenshot",
        body: [
          "Open the Web to Screenshot tool, paste the URL, choose Full Page export, AI Cleanup, or Manual Interaction, select the viewport width, and capture the screenshot. Bulk mode supports Full Page export and AI Cleanup for repeatable captures.",
        ],
      },
    ],
  },
  {
    slug: "convert-webpage-to-clean-markdown",
    title: "How to Convert a Webpage to Clean Markdown",
    description:
      "Convert a webpage to readable Markdown using AI Cleanup, full-page export, or manual element removal.",
    canonical: "https://distillpage.com/blog/convert-webpage-to-clean-markdown",
    toolName: "Web to Markdown",
    toolPath: "/web-to-markdown",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    intro:
      "Markdown is a practical format for notes, documentation, research archives, and LLM input. DistillPage can preserve the full page, use AI Cleanup to identify unrelated elements, or let you manually control what reaches the final Markdown.",
    sections: [
      {
        heading: "Why clean Markdown is better than raw HTML",
        body: [
          "HTML is built for browsers, not for reading, editing, or feeding into documentation workflows. A raw page can include scripts, tracking markup, navigation, repeated links, promotional blocks, and layout containers that add noise.",
          "Clean Markdown keeps headings, paragraphs, lists, links, and other readable structure while leaving behind the parts that only matter to the original website layout.",
        ],
      },
      {
        heading: "Remove page clutter before conversion",
        body: [
          "A converter can only work with the page state it receives. If the webpage includes a modal, a subscription banner, a sticky header, or a large sidebar, those elements can pollute the Markdown output.",
          "AI Cleanup asks OpenAI to identify navigation, ads, cookie notices, signup prompts, footers, and unrelated sidebars before conversion. This works across websites that use different class names and DOM structures.",
          "Manual Interaction is the default for single-page conversion and lets you preview the webpage and remove exact elements before export. Full Page export keeps everything when cleanup is not appropriate.",
        ],
      },
      {
        heading: "When to use AI Cleanup",
        body: [
          "AI Cleanup is useful for research collections, documentation ingestion, and LLM workflows where repeated site chrome adds noise. The model receives a compact DOM outline and chooses unwanted containers while preserving primary content.",
          "Use Manual Interaction when you need to inspect the page first or preserve unusual supporting content. Use Full Page export when the complete page structure is part of the material you need.",
        ],
      },
      {
        heading: "Common uses for webpage to Markdown conversion",
        body: [
          "Researchers can save readable source material. Developers can move web documentation into local notes. Content teams can turn reference pages into editable drafts. AI workflows can use clean Markdown as more compact, structured context than raw HTML.",
          "For bulk work, converting multiple URLs into Markdown files creates a consistent archive that is easier to search, diff, summarize, and reuse.",
        ],
      },
      {
        heading: "How to export Markdown from a URL",
        body: [
          "Open the Web to Markdown tool, paste the page URL, and choose Full Page export, AI Cleanup, or Manual Interaction. Manual Interaction opens the preview for exact removal. Use bulk mode with Full Page export or AI Cleanup when you need Markdown from several related pages.",
        ],
      },
    ],
  },
  {
    slug: "extract-structured-json-from-webpage",
    title: "How to Extract Custom Structured JSON from a Webpage",
    description:
      "Extract standard webpage data or define custom structured JSON with a prompt and optional JSON Schema.",
    canonical: "https://distillpage.com/blog/extract-structured-json-from-webpage",
    toolName: "Web to JSON",
    toolPath: "/web-to-json",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-11",
    intro:
      "Webpages contain useful data, but the fields you need vary from page to page. DistillPage can create its standard webpage JSON or extract custom records and fields from your instructions, with an optional JSON Schema to define the exact result.",
    sections: [
      {
        heading: "Why structured JSON is useful",
        body: [
          "Markdown is great for readable content, but developers and data teams often need fields they can parse directly. Structured JSON separates the page title, author, date, headings, paragraphs, tables, images, links, and metadata into a shape that can be consumed by scripts, databases, and LLM pipelines.",
          "This is helpful for AI developers building ingestion pipelines, data engineers collecting web references, scrapers prototyping extraction rules, and teams that need repeatable page exports without manually copying content from the browser.",
        ],
      },
      {
        heading: "Standard JSON or custom extraction",
        body: [
          "Standard extraction collects common webpage fields such as title, author, published date, headings, paragraph text, tables, images, links, canonical URL, meta tags, Open Graph tags, Twitter tags, and JSON-LD.",
          "Custom extraction lets you describe the data you want in plain language. For example, ask for every product's name, price, rating, and availability, or request the company name, funding stage, founders, and contact details from a profile page.",
        ],
      },
      {
        heading: "Use a JSON Schema when the shape matters",
        body: [
          "A prompt explains what to extract. An optional JSON Schema defines how the response must be structured, including field names, value types, required fields, nested objects, and arrays of repeated records.",
          "Schema-driven extraction is useful when the JSON will feed an API, database, automation, or typed application. DistillPage validates that the schema has an object root and checks the extracted result against it before returning the data.",
        ],
      },
      {
        heading: "Clean the page before extracting",
        body: [
          "Many pages include cookie banners, newsletter forms, promotional blocks, sidebars, and repeated navigation that can pollute extracted data. AI Cleanup asks OpenAI to identify these unrelated containers even when each website uses different class names.",
          "Manual Interaction is the default for single-page extraction and opens a preview where you can remove exact elements. Full Page export preserves all page content when you need a complete dataset.",
        ],
      },
      {
        heading: "Create reliable repeated records",
        body: [
          "When a page contains repeated items such as products, jobs, events, properties, or search results, ask for an array of objects with the same fields. This makes the result ready for filtering, analysis, or conversion into rows.",
          "Tell the extractor not to invent missing values and use a schema when downstream code requires consistent types. The custom extractor treats webpage content as untrusted data and follows your extraction request rather than instructions found inside the page.",
        ],
      },
      {
        heading: "When to use bulk JSON export",
        body: [
          "Bulk mode is useful when you have several related URLs to process at once. You can export a ZIP with one JSON file per URL or create a combined JSON file for downstream processing.",
          "Use ZIP mode when each page should remain independent. Use combined JSON when you want a single payload for analysis, search indexing, comparison, summarization, or dataset creation.",
        ],
      },
      {
        heading: "How to extract webpage JSON",
        body: [
          "Open the Web to JSON tool and paste a URL. Choose Standard extraction for the built-in webpage structure, or Custom extraction to enter a request and optional JSON Schema. Then choose Full Page export, AI Cleanup, or Manual Interaction and extract the result.",
          "Custom extraction is available for a single URL. For multiple pages using the standard structure, switch to bulk mode, paste one URL per line, and choose a ZIP or combined JSON file.",
        ],
      },
    ],
  },
  {
    slug: "export-webpage-data-to-csv",
    title: "How to Export Webpage Data to CSV",
    description:
      "Turn webpage tables, listings, and repeated records into a clean CSV using a custom extraction prompt.",
    canonical: "https://distillpage.com/blog/export-webpage-data-to-csv",
    toolName: "Web to CSV",
    toolPath: "/web-to-csv",
    publishedAt: "2026-06-11",
    updatedAt: "2026-06-11",
    intro:
      "Copying webpage data into a spreadsheet is slow and error-prone. DistillPage lets you describe the records you need, extracts them from the page, and generates a UTF-8 CSV with consistent columns.",
    sections: [
      {
        heading: "What kinds of pages work well",
        body: [
          "CSV export is useful for product listings, pricing tables, directories, search results, job boards, event lists, property listings, and other pages with repeated records.",
          "The page does not need to contain a traditional HTML table. A custom extraction request can turn visually repeated cards or list items into rows.",
        ],
      },
      {
        heading: "Describe the rows you need",
        body: [
          "Enter a direct request such as: Extract every product's name, price, rating, availability, and product URL. DistillPage uses the first repeated object array in the extracted result as the CSV records.",
          "An optional JSON Schema can define field names and types before extraction. This is useful when you need stable column names for an import, automation, or recurring analysis.",
        ],
      },
      {
        heading: "How nested data becomes columns",
        body: [
          "Nested object fields are flattened into dot-separated columns so useful details are not lost. Lists and more complex values remain valid serialized data inside their cells.",
          "The CSV includes a header row and UTF-8 encoding for broad spreadsheet compatibility. Values that could be interpreted as spreadsheet formulas are escaped before export.",
        ],
      },
      {
        heading: "How to export a webpage to CSV",
        body: [
          "Open Web to CSV, paste the webpage URL, and describe the repeated records to extract. Add an optional JSON Schema when you need a strict structure, then generate and download the .csv file.",
        ],
      },
    ],
  },
  {
    slug: "export-webpage-data-to-excel",
    title: "How to Export Webpage Data to Excel",
    description:
      "Create an Excel workbook from webpage records, with supporting metadata, links, images, and tables when available.",
    canonical: "https://distillpage.com/blog/export-webpage-data-to-excel",
    toolName: "Web to Excel",
    toolPath: "/web-to-excel",
    publishedAt: "2026-06-11",
    updatedAt: "2026-06-11",
    intro:
      "An Excel workbook is useful when webpage data needs more context than a single flat file can provide. DistillPage extracts the records you describe and creates a workbook that can also preserve supporting page data in separate sheets.",
    sections: [
      {
        heading: "When Excel is better than CSV",
        body: [
          "Choose Excel when people will review the data directly, when you want filters in the header row, or when the source includes useful metadata, links, images, or multiple tables.",
          "CSV remains a good choice for a simple import or data pipeline. Excel is better for a self-contained workbook that keeps the primary records and supporting context together.",
        ],
      },
      {
        heading: "Extract custom records from any layout",
        body: [
          "Describe the rows you need in plain language, even when the webpage uses cards, lists, or other visual layouts instead of a table. An optional JSON Schema can enforce the expected fields and repeated-record structure.",
          "The first repeated object array becomes the Records sheet. Nested objects are flattened into columns, which makes the primary dataset easy to sort and filter.",
        ],
      },
      {
        heading: "What the workbook can contain",
        body: [
          "Every workbook includes a Records sheet. When the extracted data provides them, DistillPage also creates Metadata, Links, Images, and Tables sheets so supporting page information remains accessible without crowding the main records.",
          "Header rows are styled and filtered, cell values are cleaned for spreadsheet compatibility, and potentially executable formula-like values are escaped.",
        ],
      },
      {
        heading: "How to export a webpage to Excel",
        body: [
          "Open Web to Excel, paste the webpage URL, describe the records to extract, and optionally provide a JSON Schema. Generate the export and download the resulting .xlsx workbook.",
        ],
      },
    ],
  },
  {
    slug: "crawl-and-export-a-website",
    title: "How to Crawl and Export an Entire Website",
    description:
      "Discover same-domain pages from sitemaps and internal links, select the URLs you need, and export them together.",
    canonical: "https://distillpage.com/blog/crawl-and-export-a-website",
    toolName: "Website Bulk Export",
    toolPath: "/website-bulk-export",
    publishedAt: "2026-06-11",
    updatedAt: "2026-06-11",
    intro:
      "Collecting pages one URL at a time is impractical when you need a documentation site, blog, knowledge base, or other section of a website. DistillPage discovers same-domain pages, lets you review the URL list, and exports the selected pages together.",
    sections: [
      {
        heading: "How website discovery works",
        body: [
          "Website Bulk Export starts with the site's sitemap when one is available, including nested sitemap indexes. It can then follow same-domain internal links up to the maximum depth and page limit you choose.",
          "Use sitemap-only mode when you trust the site's published URL inventory and do not want link discovery. You can also start with a direct sitemap URL.",
        ],
      },
      {
        heading: "Control which pages are included",
        body: [
          "Include and exclude path patterns help focus the crawl. For example, include /docs/* or /blog/* while excluding admin, tag, account, or archive paths.",
          "After discovery, review the URL list and select only the pages you want to export. This prevents unwanted pages from consuming export credits or entering the final dataset.",
        ],
      },
      {
        heading: "Choose the right website export",
        body: [
          "Selected pages can be exported as Markdown, PDF, JSON, or screenshots. Markdown, PDF, and JSON support either a ZIP with one file per page or a combined file; screenshots are delivered as a ZIP.",
          "Use Full Page export to preserve each page or AI Cleanup to reduce repeated navigation, ads, prompts, and unrelated page chrome across the selected URLs.",
        ],
      },
      {
        heading: "Common bulk export workflows",
        body: [
          "Export a documentation site to Markdown for local search or LLM input, archive a blog as PDFs, collect standard JSON for analysis, or capture a set of pages as screenshots for QA and design review.",
          "Website bulk exports require sign-in, and each selected page uses one export credit. Start with a focused path pattern and page limit when testing a new site.",
        ],
      },
      {
        heading: "How to crawl and export a website",
        body: [
          "Open Website Bulk Export, enter the website or sitemap URL, set the page limit, link depth, and optional path patterns, then discover pages. Review the results, select the URLs you need, choose the format and cleanup method, and export them together.",
        ],
      },
    ],
  },
  {
    slug: "schedule-webpage-exports-with-webhooks",
    title: "How to Schedule Webpage Exports and Deliver Them by Webhook",
    description:
      "Turn a completed DistillPage export into a recurring job and receive signed webhook notifications when each run finishes.",
    canonical: "https://distillpage.com/blog/schedule-webpage-exports-with-webhooks",
    toolName: "Scheduled Exports",
    toolPath: "/web-to-pdf",
    publishedAt: "2026-06-11",
    updatedAt: "2026-06-12",
    intro:
      "A webpage export is often more useful when it runs automatically. DistillPage lets you rerun completed exports on an hourly, daily, weekly, or monthly schedule and optionally send the result status to your webhook.",
    sections: [
      {
        heading: "When to schedule an export",
        body: [
          "Scheduled exports are useful for recurring archives, refreshed datasets, periodic reports, and content pipelines that need an up-to-date copy of the same webpage without manual work.",
          "Create the first export with the settings you need, then expand Scheduling & history inside that export tool. DistillPage reuses that job as the source for every recurring run.",
        ],
      },
      {
        heading: "Choose a frequency and first run",
        body: [
          "Schedules can run hourly, daily, weekly, or monthly. You choose the first run time, and DistillPage calculates the following runs from the selected frequency.",
          "Active schedules can be paused, resumed, or deleted inside the relevant export tool. You can also open Export History from the account menu to review activity across all tools.",
        ],
      },
      {
        heading: "Deliver export events by webhook",
        body: [
          "Add an optional webhook URL when creating the schedule to receive an export.completed or export.failed event after each run. This lets another application start processing the result, record the status, or alert your team.",
          "DistillPage signs webhook requests with HMAC-SHA256 and returns the signing secret once when the schedule is created. Verify the raw request body against the X-DistillPage-Signature header before trusting an event.",
        ],
      },
      {
        heading: "How to create a scheduled export",
        body: [
          "Complete an export, expand Scheduling & history in the same tool, and select Schedule on its history card. Choose the frequency and first run time, add an optional webhook URL, and create the schedule.",
        ],
      },
    ],
  },
  {
    slug: "monitor-webpage-changes",
    title: "How to Monitor a Webpage for Changes",
    description:
      "Monitor webpage text, selected elements, structured fields, or screenshots and receive notifications when meaningful changes are detected.",
    canonical: "https://distillpage.com/blog/monitor-webpage-changes",
    toolName: "Webpage Monitoring",
    toolPath: "/change-monitoring",
    publishedAt: "2026-06-11",
    updatedAt: "2026-06-11",
    intro:
      "Webpage monitoring replaces repeated manual checks with scheduled comparisons. DistillPage establishes a baseline, checks the page on your chosen frequency, and notifies you when the monitored content changes.",
    sections: [
      {
        heading: "Choose what to monitor",
        body: [
          "Monitor cleaned text when the main written content matters, selected CSS elements when you care about exact page regions, structured JSON fields when specific values matter, or visual screenshots when layout and appearance are important.",
          "AI Cleanup can reduce noise from navigation, prompts, ads, and other unrelated page elements before text comparisons are made.",
        ],
      },
      {
        heading: "Track meaningful changes on a schedule",
        body: [
          "Choose an hourly, daily, weekly, or monthly frequency. The first check creates the baseline, and later checks compare the latest page state against it.",
          "When a change is detected, DistillPage saves a downloadable before-and-after comparison. You can also run a check immediately, pause a monitor, or resume it later.",
        ],
      },
      {
        heading: "Receive change notifications",
        body: [
          "Change alerts can be delivered to your account email or to a generic webhook, Slack webhook, or Discord webhook. Webhook notifications use the monitor.changed event and include a signing secret for verification.",
          "These notifications can feed review workflows, trigger automations, or alert a team when pricing, availability, documentation, policies, or visual content changes.",
        ],
      },
      {
        heading: "How to create a webpage monitor",
        body: [
          "Open Webpage Monitoring, enter a name and URL, select the monitoring mode and frequency, and add any CSS selectors or structured fields required by that mode. Choose email or webhook notifications, then create the monitor to queue its initial baseline check.",
        ],
      },
    ],
  },
];

const BLOG_SEO = {
  title: "DistillPage Blog",
  description:
    "Practical guides for webpage conversion, structured extraction, scheduled exports, webhooks, and webpage monitoring.",
  canonical: "https://distillpage.com/blog",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "DistillPage Blog",
    url: "https://distillpage.com/blog",
    description:
      "Practical guides for webpage conversion, structured extraction, scheduled exports, webhooks, and webpage monitoring.",
  },
};

function articleJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: article.canonical,
    author: {
      "@type": "Organization",
      name: "DistillPage",
    },
    publisher: {
      "@type": "Organization",
      name: "DistillPage",
    },
  };
}

export function BlogIndex() {
  usePageSeo(BLOG_SEO);

  return (
    <main className="article-page">
      <section className="article-hero">
        <p className="eyebrow">DistillPage Blog</p>
        <h1>Guides for cleaner webpage exports</h1>
        <p>
          Practical articles for turning webpages into focused PDFs, screenshots,
          Markdown, structured data, and complete website exports, plus scheduling
          recurring exports and monitoring webpages for changes.
        </p>
      </section>

      <section className="article-list" aria-label="Blog posts">
        {ARTICLES.map((article) => (
          <article className="article-card" key={article.slug}>
            <p>{article.toolName}</p>
            <h2>
              <Link to={`/blog/${article.slug}`}>{article.title}</Link>
            </h2>
            <p>{article.description}</p>
            <Link className="article-link" to={`/blog/${article.slug}`}>
              Read article
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const article = ARTICLES.find((item) => item.slug === slug);
  const pageArticle = article ?? ARTICLES[0];

  usePageSeo({
    title: `${pageArticle.title} - DistillPage`,
    description: pageArticle.description,
    canonical: pageArticle.canonical,
    jsonLd: articleJsonLd(pageArticle),
  });

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <main className="article-page">
      <article className="article-post">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link to="/blog">Blog</Link>
          <span>/</span>
          <span>{article.toolName}</span>
        </nav>

        <header className="article-hero">
          <p className="eyebrow">{article.toolName}</p>
          <h1>{article.title}</h1>
          <p>{article.intro}</p>
          <Link className="article-cta" to={article.toolPath}>
            Open {article.toolName}
          </Link>
        </header>

        <div className="article-body">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
