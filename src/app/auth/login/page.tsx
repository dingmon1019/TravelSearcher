import { login } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">로그인</CardTitle>
          <CardDescription>
            임직원 계정으로 로그인하여 항공권 검색을 시작하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-background/50"
              />
            </div>
            {/* Display error if present */}
            {/* Note: searchParams is now a Promise in Next.js 15+ */}
            {/* But for simplicity in this template, I'll just use it as is if it's passed as sync or async */}
            <LoginMessage searchParams={searchParams} />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              로그인
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              회원가입
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

async function LoginMessage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams
  if (params.error) {
    return <div className="text-sm font-medium text-destructive text-center">{params.error}</div>
  }
  if (params.message) {
    return <div className="text-sm font-medium text-green-600 text-center">{params.message}</div>
  }
  return null
}
