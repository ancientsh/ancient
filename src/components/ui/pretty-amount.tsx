import { cn } from '@/lib/utils'

type PrettyAmountSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'

export type { PrettyAmountSize }

type PrettyAmountProps = {
  amountFormatted: string | number
  symbol?: string
  className?: string
  smallDigits?: number
  normalPrecision?: number
  size?: PrettyAmountSize
  variant?: 'number' | 'percentage'
  usd?: string
  usdInline?: boolean
}

const sizeClasses: Record<PrettyAmountSize, { main: string; symbol: string; suffix: string; subscript: string }> = {
  xs: { main: 'text-xs', symbol: 'text-[10px]', suffix: 'text-[9px]', subscript: 'text-[8px]' },
  sm: { main: 'text-sm', symbol: 'text-xs', suffix: 'text-[10px]', subscript: 'text-[9px]' },
  base: { main: 'text-base', symbol: 'text-sm', suffix: 'text-xs', subscript: 'text-[10px]' },
  lg: { main: 'text-lg', symbol: 'text-base', suffix: 'text-sm', subscript: 'text-xs' },
  xl: { main: 'text-xl', symbol: 'text-lg', suffix: 'text-base', subscript: 'text-sm' },
  '2xl': { main: 'text-2xl', symbol: 'text-xl', suffix: 'text-lg', subscript: 'text-base' },
}

function toNumberSafe(amountFormatted: string): number {
  const normalized = amountFormatted.replace(/,/g, '').trim()
  const num = Number(normalized)
  return Number.isFinite(num) ? num : 0
}

function abbreviateNumber(value: number): { text: string; suffix: string } {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  const units: Array<{ v: number; s: string }> = [
    { v: 1e12, s: 'T' },
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' },
  ]
  for (const u of units) {
    if (abs >= u.v) {
      const n = abs / u.v
      const text = `${sign}${n.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false,
      })}`
      return { text, suffix: u.s }
    }
  }
  return { text: value.toString(), suffix: '' }
}

function getTinyParts(
  amountFormatted: string,
  options: { digits: number }
): { sign: string; leading: string; zerosCount: number; rest: string } | null {
  const src = amountFormatted.replace(/,/g, '').trim()
  if (!src) return null
  const sign = src.startsWith('-') ? '-' : ''
  const s = sign ? src.slice(1) : src
  if (!s.startsWith('0.')) return null
  const after = s.slice(2)
  const match = after.match(/^(0+)(\d*)/)
  if (!match || !match[1]) return null
  const zeros = match[1].length
  if (zeros < 3) return null
  const restDigits = (match[2] || '').slice(0, options.digits)
  return {
    sign,
    leading: '0.0',
    zerosCount: zeros,
    rest: restDigits || '0',
  }
}

export function PrettyAmount({
  amountFormatted,
  symbol,
  className,
  smallDigits = 4,
  normalPrecision = 2,
  size = 'base',
  variant = 'number',
  usd,
  usdInline = false,
}: PrettyAmountProps) {
  const numeric = toNumberSafe(amountFormatted.toString())
  const sizes = sizeClasses[size]
  const isBig = Math.abs(numeric) >= 1000
  const isTinyCandidate = Math.abs(numeric) > 0 && Math.abs(numeric) < 0.001

  const formatUsd = (usdValue: string) => {
    const usdNum = toNumberSafe(usdValue)
    if (usdNum === 0 && parseFloat(usdValue) === 0) return null
    const abs = Math.abs(usdNum)
    if (abs >= 1000) {
      const abbreviated = abbreviateNumber(usdNum)
      return `$${abbreviated.text}${abbreviated.suffix}`
    }
    if (abs > 0 && abs < 0.001) {
      const tiny = getTinyParts(usdValue, { digits: 4 })
      if (tiny) {
        return `$${tiny.sign}${tiny.leading}${tiny.zerosCount}${tiny.rest}`
      }
    }
    const precision = abs === 0 ? 2 : 2
    return `$${abs.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })}`
  }

  const usdFormatted = usd ? formatUsd(usd) : null

  const AmountWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!usdFormatted) {
      return <>{children}</>
    }
    if (usdInline) {
      return (
        <span className={cn('inline-flex items-baseline gap-1.5', className)}>
          {children}
          <span className={cn('text-muted-foreground text-xs')}>{usdFormatted}</span>
        </span>
      )
    }
    return (
      <span className={cn('inline-flex flex-col', className)}>
        {children}
        <span className={cn('text-muted-foreground text-[10px] mt-0.5')}>{usdFormatted}</span>
      </span>
    )
  }

  if (variant === 'percentage') {
    if (isBig) {
      const { text, suffix } = abbreviateNumber(numeric)
      return (
        <AmountWrapper>
          <span className={cn('inline-flex items-baseline gap-0.5 sm:gap-1', className)}>
            <span className={sizes.main}>{text}</span>
            <span className={cn('text-muted-foreground -ml-0.5 sm:-ml-1 font-bold', sizes.suffix)}>{suffix}</span>
            <span className={cn('text-muted-foreground', sizes.symbol)}>%</span>
          </span>
        </AmountWrapper>
      )
    }
    const percentText = numeric.toLocaleString('en-US', {
      minimumFractionDigits: normalPrecision,
      maximumFractionDigits: normalPrecision,
      useGrouping: false,
    })
    return (
      <AmountWrapper>
        <span className={cn('inline-flex items-baseline gap-0.5 sm:gap-1', className)}>
          <span className={sizes.main}>{percentText}</span>
          <span className={cn('text-muted-foreground', sizes.symbol)}>%</span>
        </span>
      </AmountWrapper>
    )
  }

  if (isBig) {
    const { text, suffix } = abbreviateNumber(numeric)
    return (
      <AmountWrapper>
        <span className={cn('inline-flex items-baseline gap-0.5 sm:gap-1', className)}>
          <span className={sizes.main}>{text}</span>
          <span className={cn('text-muted-foreground -ml-0.5 sm:-ml-1 font-bold', sizes.suffix)}>{suffix}</span>
          {symbol ? <span className={cn('text-muted-foreground', sizes.symbol)}>{symbol}</span> : null}
        </span>
      </AmountWrapper>
    )
  }

  if (isTinyCandidate) {
    const tiny = getTinyParts(amountFormatted.toString(), { digits: smallDigits })
    if (tiny) {
      return (
        <AmountWrapper>
          <span className={cn('inline-flex items-baseline gap-0.5 sm:gap-1', className)}>
            {tiny.sign && <span className={sizes.main}>{tiny.sign}</span>}
            <span className={sizes.main}>
              {tiny.leading}
              <span className={cn('align-sub leading-none opacity-70', sizes.subscript)}>{tiny.zerosCount}</span>
              {tiny.rest}
            </span>
            {symbol ? <span className={cn('text-muted-foreground', sizes.symbol)}>{symbol}</span> : null}
          </span>
        </AmountWrapper>
      )
    }
  }

  const normalText = (() => {
    const n = Math.abs(numeric)
    const sign = numeric < 0 ? '-' : ''
    const precision = n === 0 ? 2 : normalPrecision
    const txt = n.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: false,
    })
    return `${sign}${txt}`
  })()

  return (
    <AmountWrapper>
      <span className={cn('inline-flex items-baseline gap-0.5 sm:gap-1', className)}>
        <span className={sizes.main}>{normalText}</span>
        {symbol ? <span className={cn('text-muted-foreground', sizes.symbol)}>{symbol}</span> : null}
      </span>
    </AmountWrapper>
  )
}
