"use client";
import { Dashboard, type DashboardProps } from "@/components/dashboard";
import { Casca, ConteudoDaCasca } from "@/components/identidade/casca";

// I1-PR-9: a casca nova (barra superior) no lugar do ResponsiveLayout; a navegação é da casca.
export default function DashboardPageClient(props: DashboardProps) {
  return (
    <Casca>
      <ConteudoDaCasca>
        <Dashboard {...props} />
      </ConteudoDaCasca>
    </Casca>
  );
}
