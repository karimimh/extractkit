interface BulkUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  maxUrls?: number;
  validCount: number;
}

export function BulkUrlInput({ value, onChange, maxUrls = 50, validCount }: BulkUrlInputProps) {
  return (
    <div className="bulk-url-input">
      <textarea
        className="bulk-url-textarea"
        placeholder={`https://example.com/article-1\nhttps://another-domain.com/page\nhttps://third-domain.com/resource`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
      <p className="bulk-url-hint">
        {validCount} URL{validCount !== 1 ? "s" : ""} detected
        {validCount >= maxUrls && ` · ${maxUrls} max`}
      </p>
    </div>
  );
}
