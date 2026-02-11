import { redirect } from "next/navigation";

type PageProps = {
  params: { id: string };
};

export default function PropertyRedirectPage({ params }: PageProps) {
  redirect(`/properties/${params.id}`);
}
