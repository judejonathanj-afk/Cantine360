import { Suspense } from "react";
import { PlatformLoginClient } from "./ui";

export default function PlatformLoginPage() {
  return (
    <Suspense>
      <PlatformLoginClient />
    </Suspense>
  );
}
