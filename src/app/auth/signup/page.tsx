import { signup } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle>
          <CardDescription>
            새 계정을 만들고 항공권 검색 기능을 이용하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signup} className="space-y-4">
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
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-background/50"
              />
            </div>
            <SignupError searchParams={searchParams} />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              계정 생성
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

async function SignupError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  if (params.error) {
    return <div className="text-sm font-medium text-destructive text-center">{params.error}</div>
  }
  return null
}
