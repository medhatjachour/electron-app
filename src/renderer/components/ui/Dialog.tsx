import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`
      fixed inset-0 z-50 bg-black/80 
      data-[state=open]:animate-in data-[state=closed]:animate-out 
      data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
      ${className}
    `}
    {...props}
  />
))

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={`
        fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] 
        translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 
        data-[state=open]:animate-in data-[state=closed]:animate-out 
        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
        data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 
        data-[state=closed]:slide-out-to-left-1/2 
        data-[state=closed]:slide-out-to-top-[48%] 
        data-[state=open]:slide-in-from-left-1/2 
        data-[state=open]:slide-in-from-top-[48%] 
        sm:rounded-lg ${className}
      `}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))

DialogContent.displayName = DialogPrimitive.Content.displayName

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}