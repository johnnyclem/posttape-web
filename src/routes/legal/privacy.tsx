import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";

export const Route = createFileRoute("/legal/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell title="Privacy" current="/legal/privacy">
      <p>
        Plugin inventories, machine names, and Environment scans are treated as
        sensitive. They are private by default, shared only per song with named
        collaborators, and never used for advertising.
      </p>
      <p>
        Sign-in uses Google or X through the Grok broker. This app stores its
        own session. You can list and revoke sessions, claim a handle, and
        request account deletion (30-day grace, then personal data is wiped and
        collaborative history is anonymized).
      </p>
      <p>
        You can export what this prototype holds by asking support; in the
        product that is a machine-readable archive. Analytics, when they exist,
        will be aggregate.
      </p>
    </LegalShell>
  );
}
