"use client";

import { useEffect, useState, useTransition } from "react";
import { getUserProfile, updateUserProfile } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileData {
    "Escritório": string;
    "Nome do advogado": string;
    "Endereço": string;
    "Tempo até alguém entrar em contato": string;
    "link da planilha": string;
    "token_uazapi": string;
    "telefone": string;
    [key: string]: any;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        async function loadProfile() {
            try {
                const data = await getUserProfile();
                setProfile(data);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast.error("Erro ao carregar perfil");
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await updateUserProfile(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Perfil atualizado com sucesso!");
                // Reload profile to get fresh data confirms update
                const data = await getUserProfile();
                setProfile(data);
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center text-red-500">Erro ao carregar dados.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Meu Perfil
            </h1>

            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Informações do Usuário</CardTitle>
                    <CardDescription>Gerencie suas informações comerciais e de contato.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="telefone">Telefone (Login)</Label>
                            <Input
                                id="telefone"
                                value={profile.telefone || ''}
                                disabled
                                className="bg-muted text-muted-foreground cursor-not-allowed"
                            />
                            <p className="text-xs text-muted-foreground">O telefone é usado para login e não pode ser alterado.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="escritorio">Nome do Escritório</Label>
                            <Input
                                id="escritorio"
                                name="escritorio"
                                defaultValue={profile["Escritório"] || ''}
                                placeholder="Ex: Silva & Souza Advogados"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nome_advogado">Nome do Advogado Principal</Label>
                            <Input
                                id="nome_advogado"
                                name="nome_advogado"
                                defaultValue={profile["Nome do advogado"] || ''}
                                placeholder="Nome completo"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input
                                id="endereco"
                                name="endereco"
                                defaultValue={profile["Endereço"] || ''}
                                placeholder="Endereço comercial completo"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tempo_contato">Tempo de Contato</Label>
                            <Input
                                id="tempo_contato"
                                name="tempo_contato"
                                defaultValue={profile["Tempo até alguém entrar em contato"] || ''}
                                placeholder="Ex: 24 horas"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="token_uazapi">Token Uazapi</Label>
                            <Input
                                id="token_uazapi"
                                name="token_uazapi"
                                defaultValue={profile["token_uazapi"] || ''}
                                placeholder="Token da API"
                                type="password"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="link_planilha">Link da Planilha</Label>
                            <Input
                                id="link_planilha"
                                name="link_planilha"
                                defaultValue={profile["link da planilha"] || ''}
                                placeholder="URL da planilha Google Sheets"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
