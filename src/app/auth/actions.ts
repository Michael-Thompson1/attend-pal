"use server";

import { createClient } from "@/lib/supabase/server";
import { lecturerSignUpSchema } from "@/lib/utils/schemas";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthActionResult = {
  success?: boolean;
  error?: string;
  field?: "email" | "password" | "fullName" | "general";
  email?: string;
};

/**
 * Validates domain against configured ALLOWED_DOMAINS environment variable
 * and the database allowed_domains table.
 */
function isDomainAllowed(email: string): boolean {
  const parts = email.toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];

  const envDomains = (process.env.ALLOWED_DOMAINS || "")
    .toLowerCase()
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  return envDomains.includes(domain);
}

/**
 * Lecturer Registration Server Action
 */
export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim()?.toLowerCase() || "";
  const password = (formData.get("password") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";
  const institution = (formData.get("institution") as string)?.trim() || "ucc";

  // Validate passwords match
  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", field: "password" };
  }

  // Schema validation
  const validation = lecturerSignUpSchema.safeParse({ fullName, email, password });
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return {
      error: issue.message,
      field: issue.path[0] as "email" | "password" | "fullName",
    };
  }

  // Pre-check domain before hitting Supabase
  if (!isDomainAllowed(email)) {
    return {
      error: "Please use your official school email address (e.g. @stu.ucc.edu.gh or @ucc.edu.gh).",
      field: "email",
    };
  }

  const supabase = await createClient();
  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        institution,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    // Provide user-friendly error message
    if (error.message.includes("already registered") || error.status === 422) {
      return {
        error: "An account with this email address already exists. Please log in.",
        field: "email",
      };
    }
    return { error: error.message, field: "general" };
  }

  return { success: true, email: data.user?.email || email };
}

/**
 * Lecturer Log In Server Action
 */
export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim()?.toLowerCase() || "";
  const password = (formData.get("password") as string) || "";

  if (!email || !password) {
    return { error: "Please enter your school email and password." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return {
        error: "Your email has not been confirmed yet. Please check your inbox for the activation link.",
        field: "email",
      };
    }
    return {
      error: "Invalid email or password. Please verify your credentials and try again.",
      field: "general",
    };
  }

  redirect("/dashboard");
}

/**
 * Resend Email Confirmation Action
 */
export async function resendVerificationEmailAction(email: string): Promise<AuthActionResult> {
  if (!email) return { error: "Email address is required." };

  const supabase = await createClient();
  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Sign Out Action
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
