import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import { AuthProvider } from "@/context/AuthContext";
import { ExchangeRateProvider } from "@/context/ExchangeRateContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { GarmentsProvider } from "@/context/GarmentsContext";
import { ClientsProvider } from "@/context/ClientsContext";
import { MaterialsProvider } from "@/context/MaterialsContext";
import { StockProvider } from "@/context/StockContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wingx Gestion",
  description: "Sistema de control de inventario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-950 text-white`}>
        <AuthProvider>
          <ExchangeRateProvider>
            <OrdersProvider>
              <GarmentsProvider>
                <ClientsProvider>
                  <MaterialsProvider>
                    <StockProvider>
                      <NotificationsProvider>
                        <ErrorBoundary>
                          <Shell>{children}</Shell>
                        </ErrorBoundary>
                      </NotificationsProvider>
                    </StockProvider>
                  </MaterialsProvider>
                </ClientsProvider>
              </GarmentsProvider>
            </OrdersProvider>
          </ExchangeRateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
