import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, BotMessageSquare } from "lucide-react"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BotMessageSquare className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">Legal Contract Analyzer</span>
        </Link>
        <nav className="hidden flex-1 items-center space-x-4 md:flex">
          {/* Future nav links can go here */}
          {/* <Link href="/history" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            History
          </Link> */}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* <ModeToggle /> User settings or login can go here */}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium mt-6">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <BotMessageSquare className="h-6 w-6 text-primary" />
                <span className="sr-only">AI Contract Analyzer</span>
              </Link>
              {/* <Link
                href="/history"
                className="text-muted-foreground hover:text-foreground"
              >
                History
              </Link> */}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
