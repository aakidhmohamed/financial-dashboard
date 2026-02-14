import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "URTHLY FINANCE",
    description: "Real-time net worth and liquidity tracking for your business",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
