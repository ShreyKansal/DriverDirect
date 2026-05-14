export default function PromptEditor({ value, onChange }) {
  return (
    <label className="field">
      <span>Custom System Prompt</span>
      <textarea
        className="input min-h-36 resize-y"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe exactly how this agent should behave."
      />
    </label>
  );
}
