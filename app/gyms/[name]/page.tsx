import { Suspense } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import GymContent from "@/app/components/GymContent";
import GymContentSkeleton from "@/app/components/GymContentSkeleton";

export default async function page(props: {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ date?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const gymName = decodeURIComponent(params.name);
  const selectedDate = searchParams?.date;

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
