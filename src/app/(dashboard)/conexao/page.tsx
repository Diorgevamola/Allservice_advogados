"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Wifi, WifiOff, RefreshCw, Loader2, QrCode, CheckCircle2, AlertCircle } from "lucide-react"
import { getWhatsAppStatus, initWhatsAppInstance, connectWhatsAppInstance } from "./actions"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

export default function ConexaoPage() {
    const [status, setStatus] = useState<string>("loading")
    const [error, setError] = useState<string | null>(null)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [progress, setProgress] = useState(0)

    const fetchStatus = useCallback(async () => {
        try {
            const res = await getWhatsAppStatus()
            if (res.state) {
                setStatus(res.state)
                if (res.state === "open") {
                    setQrCode(null)
                    setIsConnecting(false)
                }
            }
            if (res.error && status === "loading") {
                setError(res.error)
            }
        } catch (err) {
            console.error("Error fetching status:", err)
        }
    }, [status])

    useEffect(() => {
        fetchStatus()
        const interval = setInterval(() => {
            if (status !== "open" || qrCode) {
                fetchStatus()
            }
        }, 10000)
        return () => clearInterval(interval)
    }, [fetchStatus, status, qrCode])

    const handleConnect = async () => {
        setIsConnecting(true)
        setProgress(10)
        setQrCode(null)

        try {
            // 1. Check if we need to init
            if (status === "not_initialized") {
                setProgress(30)
                const initRes = await initWhatsAppInstance()
                if (initRes.error) {
                    toast.error("Falha ao inicializar instância: " + initRes.error)
                    setIsConnecting(false)
                    return
                }
                toast.success("Instância inicializada com sucesso!")
            }

            // 2. Connect to get QR Code
            setProgress(60)
            const connectRes = await connectWhatsAppInstance()
            if (connectRes.error) {
                toast.error("Erro ao gerar QR Code: " + connectRes.error)
            } else if (connectRes.data?.base64 || connectRes.data?.qrcode?.base64) {
                const b64 = connectRes.data.base64 || connectRes.data.qrcode.base64;
                setQrCode(b64)
                toast.success("QR Code gerado! Escaneie no seu WhatsApp.")
                setStatus("connecting")
            } else {
                toast.error("Formato de QR Code desconhecido da Uazapi.")
            }
        } catch (err: any) {
            toast.error("Erro na conexão: " + err.message)
        } finally {
            setProgress(100)
            setTimeout(() => {
                setIsConnecting(false)
                setProgress(0)
            }, 500)
        }
    }

    const getStatusDisplay = () => {
        switch (status) {
            case "open":
                return {
                    label: "Conectado",
                    icon: <Wifi className="w-5 h-5 text-green-500" />,
                    badge: "bg-green-500/10 text-green-500 border-green-500/20",
                    description: "Seu WhatsApp está pronto para enviar e receber mensagens."
                }
            case "connecting":
                return {
                    label: "Aguardando Leitura",
                    icon: <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />,
                    badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                    description: "O sistema está aguardando você escanear o QR Code."
                }
            case "close":
                return {
                    label: "Desconectado",
                    icon: <WifiOff className="w-5 h-5 text-red-500" />,
                    badge: "bg-red-500/10 text-red-500 border-red-500/20",
                    description: "A instância está encerrada. Clique em conectar para reativar."
                }
            case "not_initialized":
                return {
                    label: "Não Inicializado",
                    icon: <AlertCircle className="w-5 h-5 text-zinc-400" />,
                    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                    description: "Nenhuma instância encontrada. Clique para criar uma nova."
                }
            case "loading":
                return {
                    label: "Verificando...",
                    icon: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
                    badge: "bg-primary/10 text-primary border-primary/20",
                    description: "Consultando servidores da Uazapi..."
                }
            default:
                return {
                    label: "Desconectado",
                    icon: <WifiOff className="w-5 h-5 text-red-500" />,
                    badge: "bg-red-500/10 text-red-500 border-red-500/20",
                    description: "Status atual não identificado. Tente conectar novamente."
                }
        }
    }

    const display = getStatusDisplay()

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
            <DashboardHeader />

            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-light tracking-tight text-foreground">Conexão WhatsApp</h1>
                        <p className="text-muted-foreground font-light">Gerencie o vínculo do seu atendimento automático.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Status Card */}
                        <Card className="bg-card/50 backdrop-blur-xl border-border shadow-xl">
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <Badge variant="outline" className={display.badge}>
                                        {display.label}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl font-light">Status da Instância</CardTitle>
                                <CardDescription>{display.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {status !== "open" && !qrCode && (
                                    <Button
                                        onClick={handleConnect}
                                        disabled={isConnecting}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl text-base font-medium transition-all shadow-lg shadow-primary/20"
                                    >
                                        {isConnecting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Iniciando...
                                            </>
                                        ) : (
                                            <>
                                                <Wifi className="mr-2 h-5 w-5" />
                                                Conectar WhatsApp
                                            </>
                                        )}
                                    </Button>
                                )}

                                {status === "open" && (
                                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-green-500 font-medium text-lg">Tudo funcionando!</h3>
                                            <p className="text-muted-foreground text-sm font-light">Sua conexão está ativa e estável.</p>
                                        </div>
                                    </div>
                                )}

                                {isConnecting && progress > 0 && progress < 100 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground font-light tracking-widest uppercase">
                                            <span>Configurando...</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-1.5" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* QR Code / Instructions Card */}
                        <div className="space-y-6">
                            {qrCode ? (
                                <Card className="bg-card/50 backdrop-blur-xl border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-light flex items-center gap-2">
                                            <QrCode className="w-5 h-5 text-primary" />
                                            Escanear QR Code
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center">
                                        <div className="p-4 bg-white rounded-3xl shadow-inner mb-6">
                                            <img
                                                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                                alt="WhatsApp QR Code"
                                                className="w-64 h-64"
                                            />
                                        </div>
                                        <div className="space-y-4 w-full">
                                            <div className="flex gap-4 p-4 rounded-2xl bg-muted/50 border border-border">
                                                <div className="text-primary font-mono text-xl">1</div>
                                                <p className="text-sm font-light leading-relaxed">Abra o WhatsApp no seu celular.</p>
                                            </div>
                                            <div className="flex gap-4 p-4 rounded-2xl bg-muted/50 border border-border">
                                                <div className="text-primary font-mono text-xl">2</div>
                                                <p className="text-sm font-light leading-relaxed">Toque em <b>Menu</b> ou <b>Configurações</b> e selecione <b>Aparelhos Conectados</b>.</p>
                                            </div>
                                            <div className="flex gap-4 p-4 rounded-2xl bg-muted/50 border border-border">
                                                <div className="text-primary font-mono text-xl">3</div>
                                                <p className="text-sm font-light leading-relaxed">Toque em <b>Conectar um aparelho</b> e aponte seu celular para esta tela.</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setQrCode(null)}
                                            className="mt-6 text-muted-foreground hover:text-foreground font-light"
                                        >
                                            Cancelar e tentar novamente
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="p-8 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                                    <div className="p-4 rounded-full bg-muted/50">
                                        <Smartphone className="w-12 h-12 text-muted-foreground/30" />
                                    </div>
                                    <div className="max-w-xs">
                                        <h3 className="text-foreground font-light text-lg mb-2">Pronto para conectar</h3>
                                        <p className="text-muted-foreground text-sm font-light">Escaneie o QR Code que aparecerá aqui após clicar no botão ao lado.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
