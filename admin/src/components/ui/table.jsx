import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Horizontal scroll lives on this wrapper. For vertical scrolling of long lists,
 * wrap <Table> in an outer container with a max-height + overflow-y (see App.jsx
 * enquiry-table-scroll) — putting max-height on this div alone is easy to miss
 * when macOS overlay scrollbars hide the thumb.
 */
const Table = ({ className, ...props }) => (
  <div className={cn("w-full overflow-x-auto", className)}>
    <table className="w-full caption-bottom text-sm" {...props} />
  </div>
)

const TableHeader = ({ className, ...props }) => (
  <thead className={cn(className)} {...props} />
)

const TableBody = ({ ...props }) => <tbody {...props} />

const TableRow = ({ className, ...props }) => (
  <tr className={cn("border-b transition-colors hover:bg-slate-100/50", className)} {...props} />
)

const TableHead = ({ className, ...props }) => (
  <th className={cn("h-12 px-4 text-left align-middle font-medium text-slate-500", className)} {...props} />
)

const TableCell = ({ className, ...props }) => (
  <td className={cn("p-4 align-middle", className)} {...props} />
)

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
