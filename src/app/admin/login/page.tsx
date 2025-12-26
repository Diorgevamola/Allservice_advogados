'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/actions";
import { useFormStatus } from "react-dom";
import { useState } from "react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Acessar Painel"}
        </Button>
    );
}

export default function AdminLoginPage() {
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        // Enforce admin login
        formData.append('type', 'admin');
        const result = await loginAction(formData);
        if (result?.error) {
            setErrorMessage(result.error);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <Card className="w-full max-w-md border-red-900/20 bg-zinc-900/50 backdrop-blur-sm">
                <CardHeader className="flex flex-col items-center space-y-2">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-red-600 ring-offset-2 ring-offset-black">
                        <img
                            src="/logo.png"
                            alt="Admin Logo"
                            className="h-full w-full object-cover grayscale"
                        />
                    </div>
                    <CardTitle className="text-2xl font-light text-center text-white">
                        Administração
                    </CardTitle>
                    <CardDescription className="text-center text-zinc-400">
                        Acesso restrito
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none text-zinc-300">
                                E-mail
                            </label>
                            <input
                                id="email"
                                name="phone" // Reusing 'phone' field as identifier in action, or I can update logic
                                type="email"
                                required
                                className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/50 px-3 py-2 text-sm text-white ring-offset-black file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="admin@allservice.ai"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none text-zinc-300">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="flex h-10 w-full rounded-md border border-zinc-800 bg-black/50 px-3 py-2 text-sm text-white ring-offset-black file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="••••••••"
                            />
                        </div>

                        {errorMessage && (
                            <div className="text-sm text-red-500 font-medium">
                                {errorMessage}
                            </div>
                        )}
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
