import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { ScholarshipInfo } from "@/components/scholarship-info"

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <header className="gradient-maroon text-white py-6 shadow-maroon-lg">
        <div className="container mx-auto px-4 flex justify-left items-center">
          <h1 className="text-3xl font-bold tracking-tight">CIT-U Non-Academic Scholars</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 items-center animate-fade-in">
        <div className="md:w-1/2">
          <ScholarshipInfo />
        </div>

        <div className="md:w-1/2 w-full max-w-md">
          <Card className="w-full shadow-strong border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-maroon-50 to-maroon-100 border-b border-maroon-200 pb-6">
              <CardTitle className="text-[#800000] text-2xl font-bold">Scholarship Portal</CardTitle>
              <CardDescription className="text-base">Login or register to apply for a scholarship</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-6 bg-white">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 p-1">
                  <TabsTrigger value="login" className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-soft">Login</TabsTrigger>
                  <TabsTrigger value="register" className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-soft">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-6">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register" className="mt-6">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center border-t bg-gray-50 py-4">
              <p className="text-sm text-gray-600">© {new Date().getFullYear()} CIT-U Non-Academic Scholars</p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
