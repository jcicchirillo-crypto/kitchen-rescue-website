import React from 'react'
import { cn } from '../../lib/utils'

 echo 'const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
))
Label.displayName = "Label"
export { Label }'
;;
badge) echo 'const Badge = ({ className, ...props }) => {
  return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400", className)} {...props} />
}
export { Badge }'
;;
table) echo 'const Table = ({ ...props }) => <div className="w-full overflow-auto"><table className="w-full caption-bottom text-sm" {...props} /></div>
const TableHeader = ({ ...props }) => <thead {...props} />
const TableBody = ({ ...props }) => <tbody {...props} />
const TableRow = ({ ...props }) => <tr className="border-b transition-colors hover:bg-slate-100/50" {...props} />
const TableHead = ({ ...props }) => <th className="h-12 px-4 text-left align-middle font-medium text-slate-500" {...props} />
const TableCell = ({ ...props }) => <td className="p-4 align-middle" {...props} />
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }'
;;esac)
