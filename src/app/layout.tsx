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
import { BolsosProvider } from "@/context/BolsosContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "sonner";

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
      <body className={`${inter.className} bg-black text-white`} suppressHydrationWarning>
        <AuthProvider>
          <ExchangeRateProvider>
            <OrdersProvider>
              <GarmentsProvider>
                <ClientsProvider>
                  <MaterialsProvider>
                    <StockProvider>
                      <BolsosProvider>
                        <ConfirmProvider>
                          <NotificationsProvider>
                            <ErrorBoundary>
                              <Shell>{children}</Shell>
                              <Toaster richColors position="top-right" theme="dark" />
                            </ErrorBoundary>
                          </NotificationsProvider>
                        </ConfirmProvider>
                      </BolsosProvider>
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
