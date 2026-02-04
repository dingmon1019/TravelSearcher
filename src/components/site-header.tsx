import Link from "next/link"
import { Plane, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/auth/actions"

export async function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <Plane className="h-6 w-6 text-primary" />
                    <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                        SkyScanner Lite
                    </span>
                </Link>
                <nav className="flex items-center gap-4">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hidden sm:inline-flex">
                        최저가 알림 설정
                    </Button>
                </nav>
            </div>
        </header>
    )
}
