"use client";
import { useEffect } from "react"; // Import useEffect
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import useSWR from "swr";
import { setGymPreferences } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingSkeleton from "./loading";

const FormSchema = z.object({
  gyms: z.array(z.string()),
});

type GymInfo = {
  id: string;
  name: string;
  areaSize: number;
  address: string;
  postcode: number;
  state: string;
  lastUpdated: string;
};

const fetchGyms = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  return response.json();
};

// Assume a fetcher for user preferences
const fetchUserPreferences = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch user preferences");
  }
  const data = await response.json();
  // Assuming the API returns { selectedGyms: ["GymName1", "GymName2"] }
  // *** Adjust this line based on your actual API response structure ***
  const selectedGyms = data[0].GymPreferences || [];
  return selectedGyms;
};

export default function GymPreferences() {
  // Fetch all gyms (existing code)
  const {
    data: allGymsData,
    error: allGymsError,
    isLoading: isLoadingAllGyms,
  } = useSWR("/api/db/gyminfo", fetchGyms);

  // Fetch user's saved preferences using SWR
  // *** Adjust "/api/user/gym-preferences" to your actual endpoint ***
  const {
    data: userPreferences,
    error: userPrefsError,
    isLoading: isLoadingUserPrefs,
  } = useSWR("/api/account/gym-preferences", fetchUserPreferences);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // Initialize with empty, will be reset later via useEffect
    defaultValues: {
      gyms: [],
    },
  });

  // Reset the form once user preferences data from SWR is loaded
  useEffect(() => {
    // Check if userPreferences data is available (fetched by SWR)
    if (userPreferences) {
      // Reset the form state with the fetched preferences
      form.reset({ gyms: userPreferences });
    }
  }, [userPreferences, form]); // Rerun effect if userPreferences or reset changes

  // Combine loading and error states from both SWR hooks
  const isLoading = isLoadingAllGyms || isLoadingUserPrefs;
  const error = allGymsError || userPrefsError;

  if (isLoading) return <LoadingSkeleton />;
  if (error) {
    console.error("Error loading data:", error); // Log the specific error
    return <div>Error loading data. Please try again later.</div>;
  }

  // Filter gyms (ensure allGymsData from SWR is used)
  const WAGyms: GymInfo[] = allGymsData.filter(
    (gym: GymInfo) => gym.state === "WA",
  );
  const SAGyms: GymInfo[] = allGymsData.filter(
    (gym: GymInfo) => gym.state === "SA",
  );
  const VICGyms: GymInfo[] = allGymsData.filter(
    (gym: GymInfo) => gym.state === "VIC",
  );
  const NSWGyms: GymInfo[] = allGymsData.filter(
    (gym: GymInfo) => gym.state === "NSW",
  );
  const QLDGyms: GymInfo[] = allGymsData.filter(
    (gym: GymInfo) => gym.state === "QLD",
  );

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const formData = new FormData();
    formData.append("gyms", JSON.stringify(data.gyms));
    setGymPreferences(formData);
    toast({
      title: "You submitted the following values:",
      description: JSON.stringify(data, null, 2),
    });
  }

  return (
    <div className="flex w-full px-8 justify-center pt-6 ">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Gym Preferences</CardTitle>
          <CardDescription>
            Select the gyms you would like to be displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="gyms"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      Western Australia
                    </FormLabel>
                    {WAGyms.map((gym) => (
                      <FormField
                        key={gym.name}
                        control={form.control}
                        name="gyms"
                        render={({ field }) => {
                          // Log form state and comparison values inside render
                          // (`Rendering checkbox for ${gym.name}. Field value:`, field.value);
                          return (
                            <FormItem
                              key={gym.name}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(gym.name)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          gym.name,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== gym.name,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {gym.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gyms"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      Victoria
                    </FormLabel>
                    {VICGyms.map((gym) => (
                      <FormField
                        key={gym.name}
                        control={form.control}
                        name="gyms"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={gym.name}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(gym.name)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          gym.name,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== gym.name,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {gym.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gyms"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      New South Wales
                    </FormLabel>
                    {NSWGyms.map((gym) => (
                      <FormField
                        key={gym.name}
                        control={form.control}
                        name="gyms"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={gym.name}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(gym.name)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          gym.name,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== gym.name,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {gym.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gyms"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      South Australia
                    </FormLabel>
                    {SAGyms.map((gym) => (
                      <FormField
                        key={gym.name}
                        control={form.control}
                        name="gyms"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={gym.name}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(gym.name)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          gym.name,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== gym.name,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {gym.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
