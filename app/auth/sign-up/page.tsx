"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from 'zod';
import { authClient } from "@/lib/auth-client"
import { signUpEmail } from "@/app/auth/actions"

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(6),
})

type FormValues = z.infer<typeof formSchema>;

function Page() {
    const [isPending, startTransition] = useTransition()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    const onSubmit = async (values: FormValues) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("email", values.email);
            formData.append("password", values.password);

            const result = await signUpEmail(formData)

        })



    }



    return (
        <div className="flex w-full px-8 justify-center pt-6 ">
            <Card>
                <CardHeader>
                    <CardTitle>Sign Up</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form} >
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your name"
                                            {...field}
                                            className="border rounded-md p-2 w-full"
                                        />
                                    </FormControl>
                                </FormItem>

                            )}
                            />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your email"
                                            {...field}
                                            className="border rounded-md p-2 w-full"
                                        />
                                    </FormControl>
                                </FormItem>

                            )}
                            />
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your password"
                                            type="password"
                                            {...field}
                                            className="border rounded-md p-2 w-full"
                                        />
                                    </FormControl>
                                </FormItem>

                            )} />

                            <div>
                                <Button type="submit" className="mt-4">
                                    Sign Up
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter>
                </CardFooter>
            </Card>
        </div >
    )
}

export default Page