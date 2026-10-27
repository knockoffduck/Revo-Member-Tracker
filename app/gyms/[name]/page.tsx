import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardHeader } from "@/components/ui/card";
import GymContent from "@/app/components/GymContent";
import GymContentSkeleton from "@/app/components/GymContentSkeleton";
import { getGymMeta } from "@/lib/fetchData";

type PageProps = {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ date?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const gymName = decodeURIComponent((await params).name);

  try {
    const gym = await getGymMeta(gymName);
    if (!gym) {
      return { title: gymName };
    }

    const location = [gym.address, gym.state].filter(Boolean).join(", ");
    const title = `${gym.name} live member count`;
    const description = `How busy ${gym.name} is right now, plus today's count against its weekly average. ${location}.`;

    return {
      title,
      description,
      alternates: { canonical: `/gyms/${encodeURIComponent(gym.name)}` },
      openGraph: { title, description, url: `/gyms/${encodeURIComponent(gym.name)}` },
    };
  } catch {
    return { title: gymName };
  }
}

export default async function page({ params, searchParams }: PageProps) {
  const gymName = decodeURIComponent((await params).name);
  const selectedDate = (await searchParams)?.date;

  return (
    <Card className="flex w-full flex-col border-0 px-5 pb-8 pt-2 sm:px-8 sm:pb-10 sm:pt-4">
      <CardHeader className="mb-1 flex flex-col items-center gap-2 px-0 pb-0 pt-2 text-center font-bold text-2xl sm:pt-4">
        <h1>{gymName}</h1>
      </CardHeader>

      <Suspense fallback={<GymContentSkeleton />}>
        <GymContent gymName={gymName} selectedDate={selectedDate} />
      </Suspense>
    </Card>
  );
}
