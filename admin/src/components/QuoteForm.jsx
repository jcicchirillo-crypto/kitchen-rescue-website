import { useId, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function QuoteForm() {
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const nameErrorId = useId();
  const emailErrorId = useId();
  const phoneErrorId = useId();
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  function validate(form) {
    const fd = new FormData(form);
    const next = {};
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();

    if (!name) next.name = "Please enter your name.";
    if (!email || !email.includes("@")) next.email = "Please enter a valid email address.";
    if (!phone) next.phone = "Please enter your phone number.";

    return next;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("");
    const form = e.currentTarget;
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("Please fix the errors below and try again.");
      return;
    }

    // submit...
    setStatus("Thanks — we'll be in touch shortly.");
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby="form-status" className="space-y-4">
      <p 
        id="form-status" 
        aria-live="polite" 
        className={`mb-3 text-sm ${status.includes("Thanks") ? "text-green-600" : status ? "text-red-600" : ""}`}
      >
        {status}
      </p>

      <div className="space-y-2">
        <Label htmlFor={nameId} className="block font-medium">
          Name <span aria-hidden="true">*</span>
        </Label>
        <Input
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? nameErrorId : undefined}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p id={nameErrorId} role="alert" className="mt-1 text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={emailId} className="block font-medium">
          Email <span aria-hidden="true">*</span>
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? emailErrorId : undefined}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p id={emailErrorId} role="alert" className="mt-1 text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={phoneId} className="block font-medium">
          Phone <span aria-hidden="true">*</span>
        </Label>
        <Input
          id={phoneId}
          name="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? phoneErrorId : undefined}
          className={errors.phone ? "border-red-500" : ""}
        />
        {errors.phone && (
          <p id={phoneErrorId} role="alert" className="mt-1 text-sm text-red-600">
            {errors.phone}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Request a quote
      </Button>
    </form>
  );
}

