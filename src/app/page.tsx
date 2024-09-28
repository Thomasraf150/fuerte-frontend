import DefaultPage from "@/components/Dashboard/DefaultPage";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title:
    "Fuerte Lending",
  description: "Lending Made Easy",
};

export default function Home() {
  return (
    <>
      <DefaultLayout>
        <DefaultPage />
      </DefaultLayout>
    </>
  );
}
