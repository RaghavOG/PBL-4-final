import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <XCircle className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold">404</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-6">
            Sorry, the page you are looking for does not exist.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
          <div className="flex space-x-2 w-full">
            <Button asChild variant="outline" className="w-1/2">
              <Link href="/signin">Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-1/2">
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

