import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/songs/$owner/$slug")({
  component: SongLayout,
});

function SongLayout() {
  return <Outlet />;
}
