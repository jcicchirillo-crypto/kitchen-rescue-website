import React from 'react'
import { cn } from '../../lib/utils'

const Table = ({ ...props }) => <div className="w-full overflow-auto"><table className="w-full caption-bottom text-sm" {...props} /></div>

const TableHeader = ({ ...props }) => <thead {...props} />

const TableBody = ({ ...props }) => <tbody {...props} />

const TableRow = ({ ...props }) => <tr className="border-b transition-colors hover:bg-slate-100/50" {...props} />

const TableHead = ({ ...props }) => <th className="h-12 px-4 text-left align-middle font-medium text-slate-500" {...props} />

const TableCell = ({ ...props }) => <td className="p-4 align-middle" {...props} />

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
