import { z } from "zod"

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  employees: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  agree: z.boolean().refine(val => val === true, "You must agree to the terms"),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

// Sign up form schema
export const signUpFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type SignUpFormData = z.infer<typeof signUpFormSchema>

// Sign in form schema
export const signInFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type SignInFormData = z.infer<typeof signInFormSchema>

// Organization setup schema
export const organizationSetupSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  organizationSlug: z.string()
    .min(3, "Organization slug must be at least 3 characters")
    .max(50, "Organization slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Organization slug can only contain lowercase letters, numbers, and hyphens")
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
      message: "Organization slug cannot start or end with a hyphen",
    }),
})

export type OrganizationSetupData = z.infer<typeof organizationSetupSchema>

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
})

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

// Team invitation schema
export const teamInvitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "member"]),
})

export type TeamInvitationData = z.infer<typeof teamInvitationSchema>

// Default form schema (for backward compatibility)
export const formSchema = contactFormSchema
export type FormData = ContactFormData
