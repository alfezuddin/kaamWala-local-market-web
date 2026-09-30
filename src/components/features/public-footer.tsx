"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/ui/social-icons";
import { APP_TAGLINE } from "@/lib/constants";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/about#careers" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Plumbing", href: "/services?category=cat-plumber" },
      { label: "Electrical", href: "/services?category=cat-electrician" },
      { label: "Cleaning", href: "/services?category=cat-cleaner" },
      { label: "Home Appliance Repair", href: "/services?category=cat-appliance" },
      { label: "home services", href: "/services" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/customer/help" },
      { label: "Contact Support", href: "/contact" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Cancellation Policy", href: "/legal/cancellation" },
    ],
  },
];

const SOCIALS = [
  { label: "Facebook", icon: FacebookIcon, href: "https://facebook.com" },
  { label: "Instagram", icon: InstagramIcon, href: "https://instagram.com" },
  { label: "X", icon: XIcon, href: "https://x.com" },
  { label: "LinkedIn", icon: LinkedInIcon, href: "https://linkedin.com" },
  { label: "YouTube", icon: YouTubeIcon, href: "https://youtube.com" },
];

export function PublicFooter() {
  const toast = useToast();
  const [email, setEmail] = React.useState("");

  return (
    <footer className="bg-sidebar text-sidebar-foreground mt-auto border-t border-sidebar-border">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <AppLogo href="/" size="lg" />
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
              {APP_TAGLINE}. KaamWala connects households with verified, background-checked local professionals for
              every household need.
            </p>
            <form
              className="mt-6 max-w-sm"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                toast.success("You're on the list!", `Offers will be sent to ${email.trim()}.`);
                setEmail("");
              }}
            >
              <label htmlFor="footer-email" className="text-sm font-medium">
                Get offers and service updates
              </label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="footer-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit">Subscribe</Button>
              </div>
            </form>
            <div className="text-muted-foreground mt-6 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="size-4" /> +91 90000 12345
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-4" /> support@kaamwala.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4" /> 4th Floor, Vijay Nagar, Indore, Madhya Pradesh 452001
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-sidebar-border pt-6 sm:flex-row">
          <p className="text-muted-foreground text-[13px]">
            © {new Date().getFullYear()} KaamWala Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            {SOCIALS.map((social) => (
              <Button
                key={social.label}
                asChild
                variant="ghost"
                size="icon-sm"
                aria-label={social.label}
              >
                <a href={social.href} target="_blank" rel="noreferrer noopener">
                  <social.icon className="size-4" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
