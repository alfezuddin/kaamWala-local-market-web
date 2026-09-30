"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Camera, KeyRound, LogOut, MapPin, Phone, Save, ShieldCheck, Trash2, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader, SectionCard } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { getCustomerAddresses, getCustomerProfile } from "@/services/customers";
import { updateCustomerAddresses, updateProfile, logout } from "@/services/auth";
import { formatDate } from "@/lib/format";
import type { Address, Customer } from "@/types";

const EMPTY_ADDRESS: Address = {
  id: "",
  label: "Home",
  line1: "",
  area: "",
  city: "",
  pincode: "",
  landmark: "",
};

export function CustomerProfilePage() {
  const toast = useToast();
  const router = useRouter();
  const { session, signIn } = useAuth();
  const userId = session?.userId;

  const [form, setForm] = React.useState({ name: "", email: "", phone: "", address: "", area: "", city: "", pincode: "" });
  const [bio, setBio] = React.useState("");
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [draft, setDraft] = React.useState<Address>(EMPTY_ADDRESS);
  const [editingAddress, setEditingAddress] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  const profileQuery = useApiQuery(
    ["profile", userId],
    () => (userId ? getCustomerProfile(userId) : Promise.resolve<Customer | null>(null)),
    { enabled: Boolean(userId) },
  );

  const addressQuery = useApiQuery(
    ["profile", "addresses", userId],
    () => (userId ? getCustomerAddresses(userId) : Promise.resolve<Address[]>([])),
    { enabled: Boolean(userId) },
  );

  // Seed the editable form from the loaded profile, adjusting state during
  // render rather than in an effect.
  const customer = profileQuery.data ?? null;
  const [lastProfile, setLastProfile] = React.useState<Customer | null>(null);
  if (customer && customer !== lastProfile) {
    setLastProfile(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address ?? "",
      area: customer.area ?? "",
      city: customer.city ?? "",
      pincode: customer.pincode ?? "",
    });
    setBio(customer.bio ?? "");
  }

  const loadedAddresses = addressQuery.data;
  const [lastAddresses, setLastAddresses] = React.useState<Address[] | null>(null);
  if (loadedAddresses && loadedAddresses !== lastAddresses) {
    setLastAddresses(loadedAddresses);
    setAddresses(loadedAddresses);
  }

  const save = useApiMutation(
    () =>
      updateProfile(userId ?? "", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        bio: bio.trim(),
      }),
    {
      onSuccess: () => {
        toast.success("Profile updated", "Your changes have been saved.");
        if (session) {
          signIn({ ...session, name: form.name.trim(), email: form.email.trim() });
        }
        profileQuery.refetch();
      },
      onError: (error) => toast.error("Could not save profile", error.message),
    },
  );

  const saveAddresses = useApiMutation((vars: Address[]) => updateCustomerAddresses(userId ?? "", vars), {
    onSuccess: () => {
      setEditingAddress(false);
      setDraft(EMPTY_ADDRESS);
      toast.success("Addresses saved");
      addressQuery.refetch();
    },
    onError: (error) => toast.error("Could not save addresses", error.message),
  });

  const dirty =
    Boolean(customer) &&
    (form.name !== customer!.name ||
      form.email !== customer!.email ||
      form.phone !== customer!.phone ||
      form.address !== (customer!.address ?? "") ||
      form.area !== (customer!.area ?? "") ||
      form.city !== (customer!.city ?? "") ||
      form.pincode !== (customer!.pincode ?? "") ||
      bio !== (customer!.bio ?? ""));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="Keep your contact details and saved addresses up to date."
        breadcrumbs={[{ label: "Customer", href: "/customer/dashboard" }, { label: "Profile" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => setConfirmLogout(true)} icon={<LogOut />}>
              Log out
            </Button>
            <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty} icon={<Save />}>
              Save changes
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-fit">
            <AvatarCircle name={form.name || "KaamWala"} size="xl" />
            <button
              type="button"
              onClick={() => toast.info("Photo upload", "Profile photos are not stored in this demo build.")}
              className="bg-background text-muted-foreground absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border shadow-soft transition hover:text-brand"
              aria-label="Change profile photo"
            >
              <Camera className="size-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{form.name || "Your name"}</h2>
              {customer && <Badge variant={customer.status === "ACTIVE" ? "success" : "warning"}>{customer.status}</Badge>}
            </div>
            <p className="text-muted-foreground text-[13px]">{form.email}</p>
            {customer && (
              <p className="text-muted-foreground mt-1 text-[13px]">
                Member since {formatDate(customer.joinedAt)} · {customer.totalBookings ?? 0} bookings
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <SectionCard
        title="Personal details"
        description="Used for booking confirmations and service updates."
        icon={<UserIcon />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Phone</Label>
            <Input
              id="p-phone"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              icon={<Phone />}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-pincode">PIN code</Label>
            <Input
              id="p-pincode"
              inputMode="numeric"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-address">Address</Label>
            <Input
              id="p-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              icon={<MapPin />}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-area">Area / locality</Label>
            <Input id="p-area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-city">City</Label>
            <Input id="p-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-bio">About you</Label>
            <Textarea
              id="p-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share preferences like preferred time slots or languages, so professionals can prepare."
            />
            <p className="text-muted-foreground text-xs">
              {bio.length}/300 characters. This helps professionals tailor the job.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Saved addresses"
        description="Pick a saved address while booking to save time."
        icon={<Building2 />}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft({ ...EMPTY_ADDRESS, id: `adr_${Date.now().toString(36)}` });
              setEditingAddress(true);
            }}
          >
            Add address
          </Button>
        }
      >
        {addresses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No saved addresses yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="border-border rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <MapPin className="text-brand size-4" />
                      {a.label}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
                      {a.line1}
                      {a.landmark ? `, near ${a.landmark}` : ""}
                      <br />
                      {a.area ? `${a.area}, ` : ""}
                      {a.city} {a.pincode}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${a.label}`}
                      onClick={() => {
                        setDraft(a);
                        setEditingAddress(true);
                      }}
                    >
                      <KeyRound />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${a.label}`}
                      onClick={() => saveAddresses.mutate(addresses.filter((x) => x.id !== a.id))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="text-brand size-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Your password was last changed on this device. Demo accounts use fixed passwords.
          </p>
          <Button asChild variant="outline" size="sm">
            <a href="/forgot-password">Change password</a>
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Log out of KaamWala?"
        description="You will need to sign in again to manage your bookings."
        confirmLabel="Log out"
        onConfirm={async () => {
          await logout();
          setConfirmLogout(false);
          toast.success("Logged out");
          router.push("/login");
        }}
      />

      {editingAddress && (
        <AddressDialog
          value={draft}
          addresses={addresses}
          onChange={setDraft}
          onClose={() => {
            setEditingAddress(false);
            setDraft(EMPTY_ADDRESS);
          }}
          onSave={() => {
            if (!draft.line1.trim() || !draft.city.trim() || !draft.pincode.trim()) {
              toast.warning("Missing details", "Street, city and PIN code are required.");
              return;
            }
            const exists = addresses.some((a) => a.id === draft.id);
            const next = exists ? addresses.map((a) => (a.id === draft.id ? { ...draft } : a)) : [...addresses, { ...draft }];
            saveAddresses.mutate(next);
          }}
        />
      )}
    </div>
  );
}

function AddressDialog({
  value,
  addresses,
  onChange,
  onClose,
  onSave,
}: {
  value: Address;
  addresses: Address[];
  onChange: (v: Address) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <ConfirmDialog
      open
      onOpenChange={(v) => !v && onClose()}
      title={addresses.some((a) => a.id === value.id) ? "Edit address" : "Add address"}
      description="Saved addresses appear while booking a service."
      confirmLabel="Save address"
      onConfirm={onSave}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="a-label">Label</Label>
          <Input
            id="a-label"
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            placeholder="Home, Office…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-pincode">PIN code</Label>
          <Input
            id="a-pincode"
            inputMode="numeric"
            value={value.pincode}
            onChange={(e) => onChange({ ...value, pincode: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="a-line1">Flat / house, street</Label>
          <Input id="a-line1" value={value.line1} onChange={(e) => onChange({ ...value, line1: e.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="a-area">Area / locality</Label>
          <Input id="a-area" value={value.area} onChange={(e) => onChange({ ...value, area: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-city">City</Label>
          <Input id="a-city" value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="a-landmark">Landmark (optional)</Label>
          <Input
            id="a-landmark"
            value={value.landmark ?? ""}
            onChange={(e) => onChange({ ...value, landmark: e.target.value })}
          />
        </div>
      </div>
    </ConfirmDialog>
  );
}
