import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata = {
	title: "HashiraService - Сервис подготовки скриптов, таблиц и плакатов",
	description: "HashiraService - комплексный сервис для подготовки скриптов, обработки таблиц и создания плакатов для проекта Электронный дом",
	generator: 'HashiraService',
	icons: {
		icon: [
			{ url: '/favicon-simple.svg', type: 'image/svg+xml' },
			{ url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
			{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
		],
		apple: [
			{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
		],
		other: [
			{ rel: 'mask-icon', url: '/favicon-simple.svg' }
		]
	}
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ru" suppressHydrationWarning>
			<head>
				<meta name="color-scheme" content="light dark" />
				<meta name="theme-color" media="(prefers-color-scheme: light)" content="#FF6B00" />
				<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#FF6B00" />
			</head>
			<body className={inter.className}>
				<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
					{children}
					<Toaster />
				</ThemeProvider>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	)
}
