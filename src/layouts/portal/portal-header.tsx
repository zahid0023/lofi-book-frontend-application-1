import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function PortalHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-7">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
