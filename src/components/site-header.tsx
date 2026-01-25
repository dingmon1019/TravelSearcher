import Link from "next/link"
import { Plane } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <Plane className="h-6 w-6 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        SkyScanner Lite
                    </span>
                </div>
                <nav className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/login">구글 로그인</Link>
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">앱 다운로드</Button>
                </nav>
            </div>
        </header>
    )
}
