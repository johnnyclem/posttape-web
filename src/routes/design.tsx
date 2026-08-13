import { createFileRoute } from "@tanstack/react-router";
import { DesignMasterSheet } from "@/components/design-system/master-sheet";

export const Route = createFileRoute("/design")({
  component: DesignPage,
  head: () => ({
    meta: [
      { title: "Posttape · Design System Master Sheet" },
      {
        name: "description",
        content:
          "Posttape design system of record — tokens, components, interaction model, screen redlines.",
      },
    ],
  }),
});

function DesignPage() {
  return <DesignMasterSheet />;
}
