type PlaceholderProps = {
  title: string;
  description: string;
};

export function ToolPlaceholder({ title, description }: PlaceholderProps) {
  return (
    <main className="page-shell">
      <div className="grain-layer" />
      <section className="export-card">
        <header className="card-header">
          <h1>{title}</h1>
          <h2 className="subtitle">{description}</h2>
        </header>
        <div className="card-grid">
          <div className="control-stack">
            <p className="message">This tool is coming soon.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
