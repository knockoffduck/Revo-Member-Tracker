import { Suspense } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import GymContent from "@/app/components/GymContent";
import GymContentSkeleton from "@/app/components/GymContentSkeleton";
import BackButton from "@/app/components/BackButton";

export default async function page(props: {
  params: Promise<{ name: string }>;
}) {
  const params = await props.params;
  const gymName = decodeURIComponent(params.name);

  return (
    <Card className="px-8 pt-6 border-0 flex flex-col justify- w-full">
      <div className="w-fit">
        <BackButton />
      </div>

      {/* Header with Gym Name */}
      {/* CrowdLevelBadge is now inside GymContent to allow Name to load instantly */}
      <CardHeader className="text-center font-bold text-2xl flex flex-col items-center gap-2 pb-0 mb-2">
        <h1>{gymName}</h1>
      </CardHeader>

      <Suspense fallback={<GymContentSkeleton />}>
        <GymContent gymName={gymName} />
      </Suspense>
    </Card>
  );
}
