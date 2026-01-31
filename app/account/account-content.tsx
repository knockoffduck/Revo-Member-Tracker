"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updateAccountEmail, updateAccountPassword } from "./actions";
import { CgSpinner } from "react-icons/cg";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Trash2, AlertTriangle, ArrowRight, Save, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface UserData {
    id: string;
    email: string;
    name: string;
    image?: string | null;
}

export function AccountContent({ user }: { user: UserData }) {
    const { toast } = useToast();
    const [email, setEmail] = useState(user.email.replace("@revo.local", ""));
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isPendingEmail, startTransitionEmail] = useTransition();
    const [isPendingPassword, startTransitionPassword] = useTransition();
    const [isPendingDelete, startTransitionDelete] = useTransition();
    const router = useRouter();

    const handleUpdateEmail = (formData: FormData) => {
        startTransitionEmail(async () => {
            const result = await updateAccountEmail(formData);
            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.message,
                });
            }
        });
    };

    const handleUpdatePassword = (formData: FormData) => {
        startTransitionPassword(async () => {
            const result = await updateAccountPassword(formData);
            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.message,
                });
            }
        });
    };

    const handleDeleteAccount = () => {
        startTransitionDelete(async () => {
            const result = await authClient.deleteUser({
                fetchOptions: {
                    onSuccess: () => {
                        toast({
                            title: "Success",
                            description: "Account deleted successfully",
                        });
                        router.push("/");
                        router.refresh();
                    },
                    onError: (ctx) => {
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: ctx.error.message || "Failed to delete account",
                        });
                    }
                }
            });
        });
    };

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/auth/sign-in");
                    router.refresh();
                },
            },
        });
    }

    return (
        <div className="flex w-full min-h-screen justify-center px-4 py-12 md:py-20">
            <div className="w-full max-w-4xl space-y-8">

                <div className="flex items-center justify-between pb-6 border-b border-border/40">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
                        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut} className="gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-4 h-4" /> Profile Information</h2>
                        <p className="text-sm text-muted-foreground">Update your account identifier (email or username).</p>
                    </div>

                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <form action={handleUpdateEmail}>
                            <CardHeader>
                                <CardTitle>Contact Info</CardTitle>
                                <CardDescription>
                                    This will be used for signing in.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email or Username</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="max-w-md bg-background/50"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-border/40 px-6 py-4 bg-muted/20">
                                <Button type="submit" disabled={isPendingEmail} className="gap-2 transition-all">
                                    {isPendingEmail ? <CgSpinner className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="grid gap-8 md:grid-cols-[1fr_2fr] pt-8 border-t border-border/40">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2"><Lock className="w-4 h-4" /> Security</h2>
                        <p className="text-sm text-muted-foreground">Ensure your account is secure by using a strong password.</p>
                    </div>

                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <form action={handleUpdatePassword}>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                    Update your password associated with this account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type="password"
                                        required
                                        className="max-w-md bg-background/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        required
                                        className="max-w-md bg-background/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-border/40 px-6 py-4 bg-muted/20">
                                <Button type="submit" disabled={isPendingPassword} className="gap-2">
                                    {isPendingPassword ? <CgSpinner className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    Update Password
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="grid gap-8 md:grid-cols-[1fr_2fr] pt-8 border-t border-border/40">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h2>
                        <p className="text-sm text-muted-foreground">Irreversible actions for your account.</p>
                    </div>

                    <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-destructive">Delete Account</CardTitle>
                            <CardDescription className="text-destructive/80">
                                Permanently delete your account and all of your content.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                This action is not reversible. Please be certain.
                            </p>
                        </CardContent>
                        <CardFooter className="border-t border-destructive/20 px-6 py-4 bg-destructive/10">
                            {!showDeleteConfirm ? (
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isPendingDelete}
                                    className="gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </Button>
                            ) : (
                                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-200">
                                    <span className="text-sm font-medium text-destructive">Are you sure?</span>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={isPendingDelete}
                                        className="gap-2"
                                    >
                                        {isPendingDelete ? <CgSpinner className="animate-spin w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                        Yes, delete
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isPendingDelete}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
