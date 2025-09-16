'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '~/components/auth/auth-provider';
import { UserMenu } from '~/components/auth/user-menu';

interface NavigationProps {
	currentPath?: string;
	user?: {
		id: string;
		name?: string;
		email?: string;
	};
}

export function Navigation({ currentPath, user }: NavigationProps = {}) {
	const pathname = usePathname();
	const { session } = useAuth();

	const activePath = currentPath || pathname;
	const currentUser = user || session?.user;

	// Don't show navigation on auth pages
	if (activePath.startsWith('/auth/')) {
		return null;
	}

	const navigationItems = [
		{ href: '/', label: 'Home', icon: '🏠' },
		{ href: '/dashboard', label: 'Dashboard', icon: '📊' },
		{ href: '/upload', label: 'Upload', icon: '📤' },
	];

	// Add authenticated user navigation items
	if (currentUser) {
		navigationItems.push(
			{ href: '/profile', label: 'Profile', icon: '👤' },
			{ href: '/settings', label: 'Settings', icon: '⚙️' }
		);
	}

	return (
		<nav className="border-gray-200 border-b bg-white shadow-sm">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 justify-between">
					<div className="flex items-center">
						<Link href="/" className="flex-shrink-0">
							<div className="flex items-center space-x-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
									<span className="font-bold text-sm">LC</span>
								</div>
								<h1 className="font-bold text-2xl text-indigo-600">LeCodeR</h1>
							</div>
						</Link>

						{/* Desktop Navigation */}
						<div className="hidden md:ml-6 md:flex md:space-x-8">
							{navigationItems.slice(0, 3).map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={`inline-flex items-center border-b-2 px-1 pt-1 font-medium text-sm ${
										activePath === item.href
											? 'border-indigo-500 text-gray-900'
											: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
									}`}
								>
									<span className="mr-1 text-xs">{item.icon}</span>
									{item.label}
								</Link>
							))}
						</div>
					</div>

					{/* Right side - User menu and mobile menu */}
					<div className="flex items-center space-x-4">
						{/* Quick stats for authenticated users */}
						{currentUser && (
							<div className="hidden lg:flex lg:items-center lg:space-x-4">
								<div className="text-right">
									<p className="font-medium text-gray-900 text-sm">
										Welcome back, {currentUser.name || 'User'}!
									</p>
									<p className="text-gray-500 text-xs">{currentUser.email}</p>
								</div>
							</div>
						)}

						{/* User Menu */}
						<UserMenu />

						{/* Mobile menu button */}
						<div className="md:hidden">
							<button
								type="button"
								className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
								aria-expanded="false"
							>
								<span className="sr-only">Open main menu</span>
								<svg
									className="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth="1.5"
									stroke="currentColor"
								>
									<title>Open main menu</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation Menu */}
				<div className="md:hidden">
					<div className="space-y-1 pt-2 pb-3">
						{navigationItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`block border-l-4 py-2 pr-4 pl-3 font-medium text-base ${
									activePath === item.href
										? 'border-indigo-500 bg-indigo-50 text-indigo-700'
										: 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
								}`}
							>
								<span className="mr-2">{item.icon}</span>
								{item.label}
							</Link>
						))}
					</div>
				</div>
			</div>
		</nav>
	);
}
