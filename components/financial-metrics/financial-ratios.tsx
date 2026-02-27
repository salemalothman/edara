"use client"

import { useLanguage } from "@/hooks/use-language"
import { useFormatter } from "@/hooks/use-formatter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts"
import { useState } from "react"
import { InfoIcon as InfoCircle } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

// Mock financial ratio data
const financialRatios = {
  overall: {
    capRate: 0.072, // 7.2%
    operatingExpenseRatio: 0.38, // 38%
    debtServiceCoverageRatio: 1.85,
    cashOnCashReturn: 0.065, // 6.5%
    grossRentMultiplier: 9.8,
    breakEvenRatio: 0.82, // 82%
  },
  residential: {
    capRate: 0.068, // 6.8%
    operatingExpenseRatio: 0.36, // 36%
    debtServiceCoverageRatio: 1.78,
    cashOnCashReturn: 0.062, // 6.2%
    grossRentMultiplier: 10.2,
    breakEvenRatio: 0.84, // 84%
  },
  commercial: {
    capRate: 0.079, // 7.9%
    operatingExpenseRatio: 0.41, // 41%
    debtServiceCoverageRatio: 1.92,
    cashOnCashReturn: 0.071, // 7.1%
    grossRentMultiplier: 9.1,
    breakEvenRatio: 0.79, // 79%
  },
}

// Benchmark data for comparison
const benchmarks = {
  capRate: { min: 0.05, target: 0.07, max: 0.09 },
  operatingExpenseRatio: { min: 0.3, target: 0.35, max: 0.45 },
  debtServiceCoverageRatio: { min: 1.25, target: 1.75, max: 2.25 },
  cashOnCashReturn: { min: 0.04, target: 0.06, max: 0.08 },
  grossRentMultiplier: { min: 8, target: 10, max: 12 },
  breakEvenRatio: { min: 0.75, target: 0.8, max: 0.85 },
}

// Pie chart data for ROI breakdown
const roiBreakdownData = [
  { name: "Rental Income", value: 85, color: "#3B82F6" }, // Blue
  { name: "Other Income", value: 15, color: "#8B5CF6" }, // Purple
]

// Pie chart data for expense breakdown
const expenseBreakdownData = [
  { name: "Maintenance", value: 28, color: "#F43F5E" }, // Red
  { name: "Property Tax", value: 22, color: "#FB7185" }, // Light Red
  { name: "Insurance", value: 15, color: "#FBBF24" }, // Yellow
  { name: "Management", value: 18, color: "#22C55E" }, // Green
  { name: "Utilities", value: 12, color: "#60A5FA" }, // Light Blue
  { name: "Other", value: 5, color: "#94A3B8" }, // Gray
]

export function FinancialRatios() {
  const { t } = useLanguage()
  const { formatPercentage } = useFormatter()
  const [propertyType, setPropertyType] = useState("overall")
  const [activeIndex, setActiveIndex] = useState(0)

  const ratios = financialRatios[propertyType as keyof typeof financialRatios]

  // Helper function to determine color based on value and benchmark
  const getRatioColor = (value: number, metric: keyof typeof benchmarks) => {
    const { min, target, max } = benchmarks[metric]

    // For metrics where higher is better (cap rate, DSCR, cash on cash)
    if (metric === "capRate" || metric === "debtServiceCoverageRatio" || metric === "cashOnCashReturn") {
      if (value >= target) return "bg-green-500"
      if (value >= min) return "bg-yellow-500"
      return "bg-red-500"
    }

    // For metrics where lower is better (operating expense ratio, break even ratio)
    if (metric === "operatingExpenseRatio" || metric === "breakEvenRatio") {
      if (value <= target) return "bg-green-500"
      if (value <= max) return "bg-yellow-500"
      return "bg-red-500"
    }

    // For GRM, closer to target is better
    if (metric === "grossRentMultiplier") {
      if (value >= min && value <= max) return "bg-green-500"
      return "bg-yellow-500"
    }

    return "bg-blue-500" // Default
  }

  // Helper function to get progress percentage
  const getProgressPercentage = (value: number, metric: keyof typeof benchmarks) => {
    const { min, max } = benchmarks[metric]

    // For metrics where we want to show percentage within range
    let percentage = ((value - min) / (max - min)) * 100

    // Clamp between 0 and 100
    percentage = Math.max(0, Math.min(100, percentage))

    return percentage
  }

  // Pie chart active sector
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333" style={{ fontSize: 20, fontWeight: "bold" }}>
          {`${value}%`}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999">
          {`(${(percent * 100).toFixed(0)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("financial.keyFinancialRatios")}</h3>
        <Tabs value={propertyType} onValueChange={setPropertyType} className="w-auto">
          <TabsList>
            <TabsTrigger value="overall">{t("financial.overall")}</TabsTrigger>
            <TabsTrigger value="residential">{t("financial.residential")}</TabsTrigger>
            <TabsTrigger value="commercial">{t("financial.commercial")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cap Rate */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t("financial.capRate")}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoCircle className="inline-block ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{t("financial.capRateInfo.title")}</h4>
                      <p className="text-sm">{t("financial.capRateInfo.description")}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>{t("financial.capRateInfo.formula")}</p>
                        <p className="mt-1">{t("financial.capRateInfo.benchmark")}</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              <span className="text-2xl font-bold">{formatPercentage(ratios.capRate)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={getProgressPercentage(ratios.capRate, "capRate")}
                className="h-2"
                indicatorClassName={getRatioColor(ratios.capRate, "capRate")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPercentage(benchmarks.capRate.min)}</span>
                <span className="font-medium">{formatPercentage(benchmarks.capRate.target)}</span>
                <span>{formatPercentage(benchmarks.capRate.max)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Expense Ratio */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t("financial.operatingExpenseRatio")}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoCircle className="inline-block ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{t("financial.operatingExpenseRatioInfo.title")}</h4>
                      <p className="text-sm">{t("financial.operatingExpenseRatioInfo.description")}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>{t("financial.operatingExpenseRatioInfo.formula")}</p>
                        <p className="mt-1">{t("financial.operatingExpenseRatioInfo.benchmark")}</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              <span className="text-2xl font-bold">{formatPercentage(ratios.operatingExpenseRatio)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={getProgressPercentage(ratios.operatingExpenseRatio, "operatingExpenseRatio")}
                className="h-2"
                indicatorClassName={getRatioColor(ratios.operatingExpenseRatio, "operatingExpenseRatio")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPercentage(benchmarks.operatingExpenseRatio.min)}</span>
                <span className="font-medium">{formatPercentage(benchmarks.operatingExpenseRatio.target)}</span>
                <span>{formatPercentage(benchmarks.operatingExpenseRatio.max)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debt Service Coverage Ratio */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t("financial.debtServiceCoverageRatio")}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoCircle className="inline-block ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{t("financial.dscRatioInfo.title")}</h4>
                      <p className="text-sm">{t("financial.dscRatioInfo.description")}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>{t("financial.dscRatioInfo.formula")}</p>
                        <p className="mt-1">{t("financial.dscRatioInfo.benchmark")}</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              <span className="text-2xl font-bold">{ratios.debtServiceCoverageRatio.toFixed(2)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={getProgressPercentage(ratios.debtServiceCoverageRatio, "debtServiceCoverageRatio")}
                className="h-2"
                indicatorClassName={getRatioColor(ratios.debtServiceCoverageRatio, "debtServiceCoverageRatio")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{benchmarks.debtServiceCoverageRatio.min.toFixed(2)}</span>
                <span className="font-medium">{benchmarks.debtServiceCoverageRatio.target.toFixed(2)}</span>
                <span>{benchmarks.debtServiceCoverageRatio.max.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash on Cash Return */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t("financial.cashOnCashReturn")}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoCircle className="inline-block ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{t("financial.cashOnCashInfo.title")}</h4>
                      <p className="text-sm">{t("financial.cashOnCashInfo.description")}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>{t("financial.cashOnCashInfo.formula")}</p>
                        <p className="mt-1">{t("financial.cashOnCashInfo.benchmark")}</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              <span className="text-2xl font-bold">{formatPercentage(ratios.cashOnCashReturn)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={getProgressPercentage(ratios.cashOnCashReturn, "cashOnCashReturn")}
                className="h-2"
                indicatorClassName={getRatioColor(ratios.cashOnCashReturn, "cashOnCashReturn")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPercentage(benchmarks.cashOnCashReturn.min)}</span>
                <span className="font-medium">{formatPercentage(benchmarks.cashOnCashReturn.target)}</span>
                <span>{formatPercentage(benchmarks.cashOnCashReturn.max)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gross Rent Multiplier */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t("financial.grossRentMultiplier")}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoCircle className="inline-block ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{t("financial.grmInfo.title")}</h4>
                      <p className="text-sm">{t("financial.grmInfo.description")}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>{t("financial.grmInfo.formula")}</p>
                        <p className="mt-1">{t("financial.grmInfo.benchmark")}</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              <span className="text-2xl font-bold">{ratios.grossRentMultiplier.toFixed(1)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={getProgressPercentage(ratios.grossRentMultiplier, "grossRentMultiplier")}
                className="h-2"
                indicatorClassName={getRatioColor(ratios.grossRentMultiplier, "grossRentMultiplier")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{benchmarks.grossRentMultiplier.min.toFixed(1)}</span>
                <span className="font-medium">{benchmarks.grossRentMultiplier.target.toFixed(1)}</span>
                <span>{benchmarks.grossRentMultiplier.max.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Break Even Ratio */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t("financial.breakEvenRatio")}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoCircle className="inline-block ml-1 h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{t("financial.breakEvenInfo.title")}</h4>
                      <p className="text-sm">{t("financial.breakEvenInfo.description")}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>{t("financial.breakEvenInfo.formula")}</p>
                        <p className="mt-1">{t("financial.breakEvenInfo.benchmark")}</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              <span className="text-2xl font-bold">{formatPercentage(ratios.breakEvenRatio)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={getProgressPercentage(ratios.breakEvenRatio, "breakEvenRatio")}
                className="h-2"
                indicatorClassName={getRatioColor(ratios.breakEvenRatio, "breakEvenRatio")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPercentage(benchmarks.breakEvenRatio.min)}</span>
                <span className="font-medium">{formatPercentage(benchmarks.breakEvenRatio.target)}</span>
                <span>{formatPercentage(benchmarks.breakEvenRatio.max)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* ROI Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t("financial.roiBreakdown")}</CardTitle>
            <CardDescription>{t("financial.roiBreakdownDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={roiBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {roiBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t("financial.expenseBreakdown")}</CardTitle>
            <CardDescription>{t("financial.expenseBreakdownDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {expenseBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
