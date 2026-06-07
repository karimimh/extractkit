type PlaceholderProps = {
  title: string;
  description: string;
};

export function ToolPlaceholder({ title, description }: PlaceholderProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <header className="card-header">
          <h1>{title}</h1>
          <h2 className="subtitle">{description}</h2>
        </header>
        <div className="card-grid">
          <div className="control-stack">
            <p className="message">This tool is coming soon.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
