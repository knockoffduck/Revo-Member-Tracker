"use client";

import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signup } from "../auth/actions";

// Define validation schema using Zod
export const signUpFormSchema = z
	.object({
		name: z
			.string()
			.min(2, { message: "Name must be at least 2 characters long" }),
		email: z.string().email({ message: "Invalid email address" }),
		password: z
			.string()
			.min(6, { message: "Password must be at least 6 characters long" })
			.regex(/[a-zA-Z0-9]/, { message: "Password must be alphanumeric" }),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords do not match",
	});

export default function SignUpForm() {
	const form = useForm<z.infer<typeof signUpFormSchema>>({
		resolver: zodResolver(signUpFormSchema),
		defaultValues: {
			name: "Daffa",
			email: "ddarm4@gmail.com",
			password: "Test@1234",
			confirmPassword: "Test@1234",
		},
	});

	async function onSubmit(values: z.infer<typeof signUpFormSchema>) {
		try {
			const error = await signup(values);
			toast.error(error);
		} catch (error) {
			console.error("Form submission error", error);
			toast.error("Failed to submit the form. Please try again.");
		}
	}

	return (
		<div className="flex min-h-[60vh] h-full w-full items-center justify-center px-4">
			<Toaster></Toaster>
			<Card className="mx-auto max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Register</CardTitle>
					<CardDescription>
						Create a new account by filling out the form below.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
							<div className="grid gap-4">
								{/* Name Field */}
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="grid gap-2">
											<FormLabel htmlFor="name">Full Name</FormLabel>
											<FormControl>
												<Input id="name" placeholder="John Doe" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Email Field */}
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem className="grid gap-2">
											<FormLabel htmlFor="email">Email</FormLabel>
											<FormControl>
												<Input
													id="email"
													placeholder="johndoe@mail.com"
													type="email"
													autoComplete="email"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Password Field */}
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem className="grid gap-2">
											<FormLabel htmlFor="password">Password</FormLabel>
											<FormControl>
												<PasswordInput
													id="password"
													placeholder="******"
													autoComplete="new-password"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Confirm Password Field */}
								<FormField
									control={form.control}
									name="confirmPassword"
									render={({ field }) => (
										<FormItem className="grid gap-2">
											<FormLabel htmlFor="confirmPassword">
												Confirm Password
											</FormLabel>
											<FormControl>
												<PasswordInput
													id="confirmPassword"
													placeholder="******"
													autoComplete="new-password"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button type="submit" className="w-full">
									Register
								</Button>
							</div>
						</form>
					</Form>
					<div className="mt-4 text-center text-sm">
						Already have an account?{" "}
						<Link href="#" className="underline">
							Login
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}