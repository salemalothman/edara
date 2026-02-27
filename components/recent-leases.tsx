"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFormatter } from "@/hooks/use-formatter"
import { useLanguage } from "@/hooks/use-language"

const leases = [
  {
    id: "L-2893743",
    tenant: "Michael O Langshire",
    amount: 4900,
    expiryDate: "2023-12-31",
  },
  {
    id: "L-8374949",
    tenant: "Salma Amattar",
    amount: 1500,
    expiryDate: "2023-12-31",
  },
  {
    id: "L-6648362",
    tenant: "Jordan K LeBron",
    amount: 2300,
    expiryDate: "2024-01-31",
  },
  {
    id: "L-5273846",
    tenant: "Amanda Casey",
    amount: 1300,
    expiryDate: "2024-02-15",
  },
  {
    id: "L-6488200",
    tenant: "Ahmad Al Jumaa",
    amount: 1850,
    expiryDate: "2024-01-31",
  },
]

export function RecentLeases() {
  const { t } = useLanguage()
  const { formatCurrency, formatDate } = useFormatter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">LEASE ID</TableHead>
          <TableHead>TENANT</TableHead>
          <TableHead>RENT AMOUNT</TableHead>
          <TableHead>EXPIRY DATE</TableHead>
          <TableHead className="text-right rtl:text-left">ACTION</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leases.map((lease) => (
          <TableRow key={lease.id}>
            <TableCell className="font-medium">{lease.id}</TableCell>
            <TableCell>{lease.tenant}</TableCell>
            <TableCell>{formatCurrency(lease.amount)}</TableCell>
            <TableCell>{formatDate(new Date(lease.expiryDate))}</TableCell>
            <TableCell className="text-right rtl:text-left">
              <Button variant="outline" size="sm">
                Extend
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
