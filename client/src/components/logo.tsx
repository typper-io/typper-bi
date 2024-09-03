import Image from 'next/image'
import { cn } from '@/lib/utils'

export const Logo = ({ size }: { size: number }) => {
  return (
    <div
      className={cn(`bg-[#95F31F] rounded-full w-${size / 4} h-${size / 4}`)}
    >
      <Image src="/logo.svg" alt="Typper BI Logo" width={size} height={size} />
    </div>
  )
}
