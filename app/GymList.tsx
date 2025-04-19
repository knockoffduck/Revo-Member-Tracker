"use client";
import { Switch } from "@/components/ui/switch";
import { Gym, GymResponse } from "./_types";
import { LocationCard } from "./components/LocationCard";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { fetchGyms } from "./actions";

// Convert ISO string to the local time (using browser's local timezone)

const convertToLocalTime = (date: Date): string => {
  const offsetMinutes = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);
  return localDate.toLocaleTimeString("en-AU", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
  });
};

const FormSchema = z.object({
  show_all: z.boolean().default(false).optional(),
});

export default function GymList({
  query,
  gymResponse,
  currentTime,
}: {
  query: string;
  gymResponse: GymResponse;
  currentTime: string;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      show_all: false,
    },
  });
  // Get the latest time in local timezone
  const [gyms, setGyms] = useState<Gym[]>(gymResponse.data);
  const latestTime = convertToLocalTime(new Date(gymResponse.timestamp));

  useEffect(() => {
    // This runs only when `id` changes after mount
    console.log("getting gyms", gyms);
    // …your logic here (e.g. fetch, state update, side‑effect)…
  }, [gyms]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const formData = new FormData();
    formData.append("gyms", JSON.stringify(data));
    setGyms(await fetchGyms(formData, currentTime));
    console.log(gyms);

    const message = data.show_all ? "Showing all gyms" : "Showing your gyms";

    toast({
      title: message,
    });
  };

  const filteredGyms = Array.isArray(gyms)
    ? gyms.filter((gym: Gym) => {
        return gym.gymName.toLowerCase().includes(query.toLowerCase());
      })
    : [];

  return (
    <div className="flex flex-col gap-6 py-6">
      <h4 className="text-xl font-normal text-center ">
        Last Fetched: {latestTime}
      </h4>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="show_all"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    type="submit"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  ></Switch>
                </FormControl>
                <FormLabel className="text-md font-medium ">
                  Show All Gyms
                </FormLabel>
              </div>
            )}
          ></FormField>
        </form>
      </Form>
      {filteredGyms?.map((gym, index) => (
        <LocationCard key={index} gym={gym}></LocationCard>
      ))}
    </div>
  );
}
