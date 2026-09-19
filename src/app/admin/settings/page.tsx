import SettingsEditor from "@/components/admin/SettingsEditor";

export default function AdminSettings() {
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-parchment text-xl">Background nasheed</h2>
      <p className="font-body text-muted mt-2 text-sm leading-relaxed">
        The soft loop that plays across the app after a visitor&apos;s first tap.
        Upload the full track — choose which part loops below, no trimming needed.
      </p>
      <div className="mt-6">
        <SettingsEditor />
      </div>
    </div>
  );
}
