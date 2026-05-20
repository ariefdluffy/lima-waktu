declare module "@tailwindcss/vite";

declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        fullName: string;
        roles: string[];
      } | null;
    }
  }
}

export {};
