import { redirect } from "next/navigation";

type UploadPageParams = {
  imageUrl?: string;
  source?: string;
};

export default async function UploadPage({
  searchParams,
}: {
  searchParams?: Promise<UploadPageParams>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const imageUrl = params?.imageUrl;
  const source = params?.source;

  if (imageUrl) {
    const sourcePart = source ? `&source=${encodeURIComponent(source)}` : "";
    redirect(`/?imageUrl=${encodeURIComponent(imageUrl)}${sourcePart}`);
  }

  redirect("/");
}
