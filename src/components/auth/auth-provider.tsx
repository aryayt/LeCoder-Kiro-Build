"use client";

import { type ReactNode, createContext, useContext } from "react";
import type { Session } from "~/lib/auth";
import { useSession } from "~/lib/auth-client";

interface AuthContextType {
	session: Session | null;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: session, isPending: isLoading } = useSession();

	return (
		<AuthContext.Provider value={{ session, isLoading }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
