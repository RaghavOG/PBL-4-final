import { DarkMagicCard } from "@/components/ui/magic-card";
import NetworkLogsPanel from "@/components/network-logs-panel";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center bg-black px-4 py-10 sm:p-8 md:p-12 lg:p-24 mt-10"
    style={{
      backgroundImage: "url('/feature-background.jpg')",
      backgroundSize: 'cover', // Ensures the background image covers the entire screen
      backgroundPosition: 'center', // Centers the image
    }}
    >
      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold text-white mb-8 lg:mb-12 font-akira">
        Sample Network Monitoring
      </h1>
      <NetworkLogsPanel />
    </main>
  );
}