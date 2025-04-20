"use client";
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
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { signInEmail } from "../actions";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof formSchema>;

function Page() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      const result = await signInEmail(formData);
    });
  };

  return (
    <div className="flex w-full px-8 justify-center pt-6 ">
      <Card className="w-full md:w-[700px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="flex-col flex gap-2"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        {...field}
                        className="border rounded-md p-2 w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your password"
                        type="password"
                        {...field}
                        className="border rounded-md p-2 w-full "
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div>
                {isPending ? (
                  <Button className="mt-4" disabled>
                    Signing In...
                  </Button>
                ) : (
                  <Button type="submit" className="mt-4">
                    Sign In
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Link href="/auth/sign-up" className="underline font-normal">
            Create an account
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Page;
