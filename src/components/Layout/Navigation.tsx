'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  LightBulbIcon,
  CameraIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Capture', href: '/capture', icon: CameraIcon },
  { name: 'Landing Pages', href: '/landing-pages', icon: PhotoIcon },
  { name: 'Competitors', href: '/competitors', icon: BuildingStorefrontIcon },
  { name: 'Semantic Analysis', href: '/semantic-analysis', icon: CpuChipIcon },
  { name: 'Insights', href: '/insights', icon: LightBulbIcon },
]

export default function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-[240px] lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col h-full bg-[#0F172A] pt-8 pb-5 px-5 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8 px-1">
            <div className="h-6 w-6 text-[#22D3EE]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <span className="font-mono text-base font-bold text-white tracking-tight">CompetitorHQ</span>
          </div>

          {/* Nav Label */}
          <p className="font-mono text-[10px] font-semibold text-[#64748B] tracking-[2px] uppercase mb-3 px-3">
            Navigation
          </p>

          {/* Nav Items */}
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#1E293B] text-[#22D3EE]'
                      : 'text-[#94A3B8] hover:bg-[#1E293B]/50 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-[#22D3EE]' : 'text-[#94A3B8]'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Attribution */}
          <div className="pt-4 border-t border-[#1E293B] mt-4">
            <p className="font-mono text-[10px] text-[#475569] text-center leading-relaxed">
              Made @Disrupt.com<br/>by Muhammad Usman Rafiq
            </p>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-[#0F172A] border-b border-[#1E293B] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 text-[#22D3EE]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <span className="font-mono text-base font-bold text-white">CompetitorHQ</span>
          </div>
          <button
            type="button"
            className="text-[#94A3B8] hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="bg-[#0F172A] border-b border-[#1E293B]">
            <nav className="px-3 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-[#1E293B] text-[#22D3EE]' : 'text-[#94A3B8]'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-[#22D3EE]' : 'text-[#94A3B8]'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </>
  )
}
