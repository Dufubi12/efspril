import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Мир Школьной Магии",
    description: "Образовательная RPG-игра для школьников",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru">
            <body style={{ margin: 0, padding: 0, background: '#020617', overflow: 'hidden' }}>
                {children}
            </body>
        </html>
    );
}
