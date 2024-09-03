'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function TypePage() {
  const dataSources = [
    {
      name: 'Postgres',
      icon: '/logos/postgres.svg',
    },
    {
      name: 'BigQuery',
      icon: '/logos/bigquery.svg',
    },
  ]

  const applications = [
    {
      name: 'Google Sheets',
      icon: '/logos/sheets.svg',
    },
  ]

  const comingSoon = [
    {
      name: 'Stripe',
      icon: '/logos/stripe.svg',
    },
    {
      name: 'Google Ads',
      icon: '/logos/ads.svg',
    },
    {
      name: 'Hubspot',
      icon: '/logos/hubspot.svg',
    },
    {
      name: 'MongoDB',
      icon: '/logos/mongodb.svg',
    },
  ]
  return (
    <div className="flex flex-col gap-y-8 rounded-lg bg-accent/50 p-4 overflow-auto h-full">
      <h2 className="text-xl font-bold">Data Sources</h2>
      <div className="grid grid-cols-3 gap-8">
        {dataSources.map((item) => (
          <Link
            href={{
              pathname: '/app/data-source/url',
              query: { sourceType: item.name },
            }}
            className="bg-accent/50 hover:bg-accent p-4 flex gap-4 items-center cursor-pointer rounded-lg"
            key={item.name}
          >
            <div className="p-3 rounded-sm bg-accent">
              <Image src={item.icon} alt={item.name} width={24} height={24} />
            </div>
            <p className="text-sm">{item.name}</p>
          </Link>
        ))}
      </div>
      <h2 className="text-xl font-bold">Applications</h2>
      <div className="grid grid-cols-3 gap-8">
        {applications.map((item) => (
          <Link
            href={{
              pathname: '/app/data-source/url',
              query: { sourceType: item.name },
            }}
            className="bg-accent/50 hover:bg-accent p-4 flex gap-4 items-center cursor-pointer rounded-lg"
            key={item.name}
          >
            <div className="p-3 bg-accent rounded-sm">
              <Image src={item.icon} alt={item.name} width={24} height={24} />
            </div>
            <p className="text-sm">{item.name}</p>
          </Link>
        ))}
      </div>
      <h2 className="text-xl font-bold">Coming soon</h2>
      <div className="grid grid-cols-3 gap-8 ">
        {comingSoon.map((item) => (
          <div
            className="bg-accent/50 p-4 flex gap-4 items-center opacity-50 rounded-lg"
            key={item.name}
          >
            <div className="p-3 rounded-sm bg-accent">
              <Image src={item.icon} alt={item.name} width={24} height={24} />
            </div>
            <p className="text-sm">{item.name}</p>
          </div>
        ))}
        <Link
          href="https://form.typeform.com/to/z9hhNimF"
          className="bg-accent/50 hover:bg-accent p-4 flex gap-4 items-center rounded-lg"
          target="_blank"
        >
          <div className="p-3 rounded-sm bg-accent">
            <Plus size={24} />
          </div>
          <p className="text-sm">Request other connection</p>
        </Link>
      </div>
    </div>
  )
}
