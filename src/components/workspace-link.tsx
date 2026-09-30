"use client";
import Link from "next/link";
import { createContext, useContext } from "react";
import type { ComponentProps } from "react";
export const WorkspaceBase = createContext("/app");
export function WorkspaceProvider({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <WorkspaceBase.Provider value={value}>{children}</WorkspaceBase.Provider>;
}
export function useWorkspaceBase() {
  return useContext(WorkspaceBase);
}
export default function WorkspaceLink({ href, ...props }: ComponentProps<typeof Link>) {
  const base = useWorkspaceBase();
  const scoped =
    typeof href === "string" && /^\/app(?:[/?#]|$)/.test(href) ? base + href.slice(4) : href;
  return <Link {...props} href={scoped} />;
}
