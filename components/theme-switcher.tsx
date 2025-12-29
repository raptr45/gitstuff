import { Button } from "@/components/ui/button";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center p-1 bg-muted/50 rounded-full border">
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 rounded-full ${
          theme === "system" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setTheme("system");
        }}
        title="System"
      >
        <Laptop className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 rounded-full ${
          theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setTheme("light");
        }}
        title="Light"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 rounded-full ${
          theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setTheme("dark");
        }}
        title="Dark"
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  );
}
