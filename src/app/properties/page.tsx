import { Suspense } from "react";
import Properties from "@/screens/Properties";

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading...</div>}>
      <Properties />
    </Suspense>
  );
}
