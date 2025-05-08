import Link from "next/link"
import { ArrowRight, Shield, Activity, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Features from '@/components/features'
import SampleNetwork from "@/components/sample-network"
import NetworkLogsPanel from "@/components/network-logs-panel"
import HeroSection from "@/components/Hero"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero Section */}
      <HeroSection />
      <Features />
     <SampleNetwork />

      

      
        </div>

  
  )
}


