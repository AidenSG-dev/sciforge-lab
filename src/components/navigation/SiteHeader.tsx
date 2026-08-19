import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUBJECTS } from "@/lib/subjects";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

const activeCls = { className: "text-foreground" } as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const setQuery = useUiStore((s) => s.setQuery);
  const navigate = useNavigate();

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setQuery(term);
    setSearchOpen(false);
    setOpen(false);
    void navigate({ to: "/explore" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-sm font-bold tracking-[0.22em] text-foreground">
              SCIFORGE
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/explore">Explore</NavItem>
            <span className="mx-2 h-4 w-px bg-border" />
            {SUBJECTS.map((subject) => (
              <NavItem key={subject.id} to={subject.path} subject={subject.id}>
                {subject.name}
              </NavItem>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="hidden items-center md:flex">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search"
                aria-label="Search simulations"
                className="h-9 w-44 border-border bg-surface pl-8 font-mono text-xs placeholder:text-muted-foreground focus-visible:ring-ring xl:w-56"
              />
            </div>
          </form>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="md:hidden"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submitSearch} className="border-t border-border px-5 py-3 md:hidden">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search simulations..."
            aria-label="Search simulations"
            className="h-10 bg-surface font-mono text-xs"
          />
        </form>
      )}

      {open && (
        <nav className="border-t border-border bg-surface px-5 py-4 lg:hidden">
          <div className="grid gap-1">
            <MobileItem to="/" onClick={() => setOpen(false)}>
              Home
            </MobileItem>
            <MobileItem to="/explore" onClick={() => setOpen(false)}>
              Explore
            </MobileItem>
            <div className="my-2 h-px bg-border" />
            {SUBJECTS.map((subject) => (
              <MobileItem key={subject.id} to={subject.path} onClick={() => setOpen(false)}>
                <span data-subject={subject.id} className="flex items-center gap-3">
                  <subject.icon className="size-4 text-subject" />
                  {subject.name}
                </span>
              </MobileItem>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function NavItem({
  to,
  children,
  subject,
}: {
  to: string;
  children: React.ReactNode;
  subject?: string;
}) {
  return (
    <Link
      to={to}
      data-subject={subject}
      activeProps={activeCls}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        subject && "hover:text-subject",
      )}
    >
      {children}
    </Link>
  );
}

function MobileItem({
  to,
  children,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeProps={activeCls}
      className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
      <circle cx="16" cy="16" r="13" className="fill-none stroke-border-strong" strokeWidth="1" />
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5"
        className="fill-none stroke-primary/70"
        strokeWidth="1.2"
        transform="rotate(-28 16 16)"
      />
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5"
        className="fill-none stroke-primary/40"
        strokeWidth="1.2"
        transform="rotate(52 16 16)"
      />
      <circle cx="16" cy="16" r="3.2" className="fill-primary" />
    </svg>
  );
}
