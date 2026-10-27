"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { signInEmail } from "../actions";
import { Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().min(3, { message: "Please enter a valid email or username" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

function Page() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // A toast disappears after a few seconds; a failed sign-in has to stay on
  // screen until the person tries again.
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      try {
        const result = await signInEmail(formData);

        if (result && !result.success) {
          setFormError(result.message || "We couldn't sign you in. Please try again.");
        } else if (result && result.success) {
          toast({
            title: "Success",
            description: result.message,
          });
          router.push("/gyms");
        }
      } catch (error) {
        // Rate limiting and database failures throw rather than returning a
        // result, and production masks the message, so keep it understandable.
        const message = error instanceof Error ? error.message : "";
        setFormError(
          message.startsWith("Too many requests")
            ? message
            : "We couldn't reach the account service. Please try again in a moment.",
        );
      }
    });
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-400px)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-20" />
      </div>

      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to sync your favorites across devices.
            <br />
            <span className="text-xs opacity-70">
              Otherwise favorites are stored locally.
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="flex flex-col gap-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email or Username
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          placeholder="Enter your email or username"
                          autoComplete="username"
                          required
                          aria-invalid={Boolean(formError)}
                          aria-describedby={formError ? "sign-in-error" : undefined}
                          {...field}
                          className="pl-9 bg-white/5 border-white/10 transition-all focus:bg-white/10 focus:border-primary/50"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          placeholder="Enter your password"
                          type="password"
                          autoComplete="current-password"
                          required
                          aria-invalid={Boolean(formError)}
                          aria-describedby={formError ? "sign-in-error" : undefined}
                          {...field}
                          className="pl-9 bg-white/5 border-white/10 transition-all focus:bg-white/10 focus:border-primary/50"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formError ? (
                <p
                  id="sign-in-error"
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary hover:text-primary/80 transition-colors underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
            >
              Create one for free
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Page;
