import { DarkMagicCard } from "@/components/ui/magic-card";

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
        Key Features
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
        {/* Card 1 */}
        <DarkMagicCard
          heading="Real-time Monitoring"
          description="Monitor network traffic in real-time with advanced visualization and alerts for suspicious activities."
          className="w-full h-full"
          gradientFrom="#4A0E4E"
          gradientTo="#0A4A94"
        >
          <p className="text-gray-400 text-justify font-mono text-xl">
          Monitor network traffic in real-time with advanced visualization and alerts for suspicious activities.
          </p>
        </DarkMagicCard>
        
        {/* Card 2 */}
        <DarkMagicCard
          heading="Threat Detection"
          description="AI-powered analysis to identify potential security threats and vulnerabilities in your network."
          className="w-full h-full"
          gradientFrom="#3B0F50"
          gradientTo="#0B5FA5"
        >
          <p className="text-gray-400 text-justify font-mono text-xl">
          AI-powered analysis to identify potential security threats and vulnerabilities in your network.
          </p>
        </DarkMagicCard>
        
        {/* Card 3 */}
        <DarkMagicCard
          heading="Secure Encryption"
          description="End-to-end encryption ensures your network data remains private and protected."
          className="w-full h-full"
          gradientFrom="#2C1053"
          gradientTo="#0C74B6"
        >
          <p className="text-gray-400 text-justify font-mono text-xl">
          End-to-end encryption ensures your network data remains private and protected.
          </p>
        </DarkMagicCard>
      </div>
    </main>
  );
}