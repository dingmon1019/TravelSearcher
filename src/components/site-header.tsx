import Link from "next/link"
import { Plane, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/auth/actions"

export async function SiteHeader() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline-block">{user.email}</span>
                            </div>
                            <form action={signOut}>
                                <Button variant="ghost" size="sm" type="submit" className="gap-2">
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline-block">로그아웃</span>
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/auth/login">로그인</Link>
                            </Button>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hidden sm:inline-flex">
                                앱 다운로드
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    )
}
