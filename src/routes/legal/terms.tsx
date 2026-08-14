import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";

export const Route = createFileRoute("/legal/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Terms of use" current="/legal/terms">
      <p>
        Posttape is a collaboration desk for songs. You keep the copyright in
        what you upload. By creating a song you affirm you have the rights to
        the material (see FR-N-01) and that you will not upload plugin binaries
        or malware.
      </p>
      <p>
        Private songs are invisible to anyone who is not a collaborator. Making
        a song public publishes its takes, comments, and collaborator handles.
        Plugin inventories stay private unless you share them on a named song.
      </p>
      <p>
        Freeze packages are planned here and executed on a machine that already
        has Live and the relevant plugs. This web app does not render Ableton
        on a server.
      </p>
      <p>
        These terms are the prototype copy. They are not a substitute for a
        reviewed legal agreement at launch.
      </p>
    </LegalShell>
  );
}
