import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils"; // If you have this utility, keep it; otherwise, remove or implement it
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface MainNavProps {
  items?: {
    title: string;
    href: string;
    description?: string;
  }[];
  children?: React.ReactNode;
}

export function MainNav({ items, children }: MainNavProps) {
  const { pathname } = useLocation();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex gap-6 md:gap-10">
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-foreground/60"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
            <div className="flex flex-col space-y-3">
              {items?.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "text-muted-foreground transition-colors hover:text-primary",
                    pathname === item.href ? "text-primary" : "text-foreground/60"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}