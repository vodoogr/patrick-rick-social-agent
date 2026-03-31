import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import "./globals.css";
import { Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Patrick Rick | Social Agent",
  description: "Autonomous AI-assisted campaign system for artist Patrick Rick.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white overflow-hidden`}>
        <AudioPlayerProvider>
          {user ? (
          <div className="flex h-screen w-full">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 ml-64">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {children}
              </main>
            </div>
          </div>
        ) : (
          <div className="h-screen w-full overflow-y-auto">
            {children}
          </div>
        )}
        </AudioPlayerProvider>
      </body>
    </html>
  );
}