import type { Metadata } from "next";
import HomePage from "@/components/Dashboard/HomePage";
import { APP_NAME, TITLE_SEPARATOR } from "@/utils/appTitle";

// Tab reads "Dashboard · Fuerte Lending". `absolute`, because the root layout's title template
// does not apply to a page in the layout's own segment (this page is the "/" segment itself).
export const metadata: Metadata = {
  title: { absolute: `Dashboard${TITLE_SEPARATOR}${APP_NAME}` },
  description: "Lending Made Easy",
};

export default function Home() {
  return <HomePage />;
}
