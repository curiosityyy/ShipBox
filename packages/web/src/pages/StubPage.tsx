import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import type { ReactNode } from "react";

interface StubPageProps {
  title: string;
  icon: ReactNode;
  description: string;
  count?: number;
}

export function StubPage({ title, icon, description, count }: StubPageProps) {
  return (
    <div className="animate-fade-up">
      <PageHeader title={title} count={count} />
      <EmptyState icon={icon} title={`${title} coming soon`} description={description} />
    </div>
  );
}
