'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Layers, ArrowUpDown, ChevronDown, Check, Search, BarChart3, Plus, RefreshCw, Download, Calendar as CalendarIcon, Trash2, X, Filter } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const AVAILABLE_DIMENSIONS = [
    { id: 'date', label: 'Date' },
    { id: 'source', label: 'Source Domain' },
    { id: 'sub_source', label: 'Sub-Publisher' },
    { id: 'lead_source', label: 'Publisher' },
    { id: 'buyer', label: 'Buyer' },
    { id: 'status', label: 'Status' }
];

const AVAILABLE_METRICS = [
    { id: 'total_leads', label: 'Total Leads' },
    { id: 'sold_leads', label: 'Sold Leads' },
    { id: 'conversion_rate', label: '% Lead Sold' },
    { id: 'email_good_rate', label: '% Email Good' },
    { id: 'ip_good_rate', label: '% IP Good' },
    { id: 'phone_good_rate', label: '% Phone Good' },
    { id: 'redirection_rate', label: '% Redirection' },
    { id: 'avg_price', label: 'Avg. Price' },
    { id: 'revenue', label: 'Revenue' }
];

export interface FilterEntry {
    id: string;
    field: string;
    operator: string;
    value: string;
}

export default function DynamicReport({ startDate, endDate }: { startDate?: Date, endDate?: Date }) {
    const [dimensions, setDimensions] = useState<string[]>(['source']);
    const [visibleMetrics, setVisibleMetrics] = useState<string[]>(AVAILABLE_METRICS.map(m => m.id));
    const [dateRangePreset, setDateRangePreset] = useState<string>('today');
    const [customRange, setCustomRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    const [filters, setFilters] = useState<FilterEntry[]>([]);
    const [filterField, setFilterField] = useState<string>(AVAILABLE_DIMENSIONS[0].id);
    const [filterOperator, setFilterOperator] = useState<string>('equals');
    const [filterValue, setFilterValue] = useState<string>('');
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'revenue', direction: 'desc' });

    const toggleMetric = (metricId: string) => {
        setVisibleMetrics(prev => {
            if (prev.includes(metricId)) {
                return prev.filter(id => id !== metricId);
            } else {
                return [...prev, metricId];
            }
        });
    };

    const fetchDynamicData = useCallback(async () => {
        if (dimensions.length === 0) {
            setData([]);
            return;
        }
        
        setLoading(true);
        try {
            // Calculate actual dates based on preset if 'custom' is not fully implemented yet 
            // or if we rely mostly on predefined ranges
            let calculatedStartDate = startDate;
            let calculatedEndDate = endDate;
            
            const now = new Date();
            
            switch (dateRangePreset) {
                case 'today':
                    calculatedStartDate = new Date(now.setHours(0,0,0,0));
                    calculatedEndDate = new Date(now.setHours(23,59,59,999));
                    break;
                case 'yesterday':
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    calculatedStartDate = new Date(yesterday.setHours(0,0,0,0));
                    calculatedEndDate = new Date(yesterday.setHours(23,59,59,999));
                    break;
                case 'last_7_days':
                    const last7 = new Date(now);
                    last7.setDate(last7.getDate() - 7);
                    calculatedStartDate = new Date(last7.setHours(0,0,0,0));
                    calculatedEndDate = new Date(now.setHours(23,59,59,999)); // end of today
                    break;
                case 'last_30_days':
                    const last30 = new Date(now);
                    last30.setDate(last30.getDate() - 30);
                    calculatedStartDate = new Date(last30.setHours(0,0,0,0));
                    calculatedEndDate = new Date(now.setHours(23,59,59,999));
                    break;
                case 'this_month':
                    calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    calculatedEndDate = new Date(now.setHours(23,59,59,999));
                    break;
                case 'last_month':
                    calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                    break;
                case 'custom':
                    calculatedStartDate = customRange?.from ? startOfDay(customRange.from) : undefined;
                    calculatedEndDate = customRange?.to ? endOfDay(customRange.to) : undefined;
                    break;
                default:
                    // Use props if any untracked value
                    break;
            }

            const payload = {
                start_date: calculatedStartDate?.toISOString(),
                end_date: calculatedEndDate?.toISOString(),
                dimensions: dimensions,
                filters: filters.map(({ field, operator, value }) => ({ field, operator, value }))
            };

            const res = await api.post('/reports/dynamic', payload);
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch dynamic report", err);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, dimensions, dateRangePreset, filters, customRange]);

    useEffect(() => {
        fetchDynamicData();
    }, [fetchDynamicData]);

    const removeFilter = (id: string) => {
        setFilters(prev => prev.filter(f => f.id !== id));
    };

    const addFilter = () => {
        if (!filterValue.trim()) return;
        const newEntry: FilterEntry = {
            id: Math.random().toString(36).substr(2, 9),
            field: filterField,
            operator: filterOperator,
            value: filterValue
        };
        setFilters(prev => [...prev, newEntry]);
        setFilterValue(''); // Reset value
        setFilterPopoverOpen(false); // Close popover
    };

    const toggleDimension = (dimId: string) => {
        setDimensions(prev => {
            if (prev.includes(dimId)) {
                return prev.filter(id => id !== dimId);
            } else {
                return [...prev, dimId];
            }
        });
    };

    const handleExportCSV = () => {
        if (data.length === 0) return;

        // Map headers based on visible dimensions and metrics
        const headerRow = [
            ...dimensions.map(dim => AVAILABLE_DIMENSIONS.find(d => d.id === dim)?.label || dim),
            ...visibleMetrics.map(met => AVAILABLE_METRICS.find(m => m.id === met)?.label || met)
        ];

        // Map data rows
        const csvRows = sortedData.map(row => {
            const rawRow = [
                ...dimensions.map(dim => {
                    const val = (dim === 'buyer' && row.buyer_name) ? row.buyer_name : row[dim];
                    return `"${String(val || '').replace(/"/g, '""')}"`;
                }),
                ...visibleMetrics.map(met => {
                    // special handling for rates to format properly or just output number
                    const val = row[met] !== undefined ? row[met] : (aggregateRates as any)[met] || 0;
                    return `"${String(val).replace(/"/g, '""')}"`;
                })
            ];
            return rawRow.join(',');
        });

        // Add totals row
        const totalsRow = [
            `"Total"`,
            ...Array(Math.max(0, dimensions.length - 1)).fill('""'), // Pad dimension columns
            ...visibleMetrics.map(met => {
                const val = (totals as any)[met] !== undefined ? (totals as any)[met] : (aggregateRates as any)[met] || 0;
                return `"${String(val).replace(/"/g, '""')}"`;
            })
        ];

        const csvContent = [headerRow.map(h => `"${h}"`).join(','), ...csvRows, totalsRow.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `dynamic_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;
        
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Handle nested or derived values (like buyer name)
        if (sortConfig.key === 'buyer') {
             valA = a.buyer_name || a.buyer;
             valB = b.buyer_name || b.buyer;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Calculate Totals
    const totals = data.reduce(
        (acc, row) => {
            acc.total_leads += row.total_leads || 0;
            acc.sold_leads += row.sold_leads || 0;
            acc.revenue += row.revenue || 0;
            
            // For rates, we'll re-calculate the aggregate average below
            acc.sum_emails_good += ((row.email_good_rate || 0) / 100) * (row.total_leads || 0);
            acc.sum_ips_good += ((row.ip_good_rate || 0) / 100) * (row.total_leads || 0);
            acc.sum_phones_good += ((row.phone_good_rate || 0) / 100) * (row.total_leads || 0);
            acc.sum_redirected += ((row.redirection_rate || 0) / 100) * (row.total_leads || 0);
            
            return acc;
        },
        { 
            total_leads: 0, 
            sold_leads: 0, 
            revenue: 0, 
            sum_emails_good: 0, 
            sum_ips_good: 0, 
            sum_phones_good: 0, 
            sum_redirected: 0 
        }
    );

    const aggregateRates = {
        conversion_rate: totals.total_leads > 0 ? (totals.sold_leads / totals.total_leads) * 100 : 0,
        email_good_rate: totals.total_leads > 0 ? (totals.sum_emails_good / totals.total_leads) * 100 : 0,
        ip_good_rate: totals.total_leads > 0 ? (totals.sum_ips_good / totals.total_leads) * 100 : 0,
        phone_good_rate: totals.total_leads > 0 ? (totals.sum_phones_good / totals.total_leads) * 100 : 0,
        redirection_rate: totals.total_leads > 0 ? (totals.sum_redirected / totals.total_leads) * 100 : 0,
        avg_price: totals.sold_leads > 0 ? (totals.revenue / totals.sold_leads) : 0,
    };

    return (
        <div className="w-full bg-background mt-4 text-sm font-sans">
            {/* Top Control Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border border-border/60 rounded-t-xl bg-card shadow-sm">
                
                {/* Left Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Dropdown */}
                    <Select value={dateRangePreset} onValueChange={setDateRangePreset}>
                        <SelectTrigger className="flex w-auto min-w-[140px] items-center gap-2 px-3 py-1.5 h-auto border border-border/80 rounded-md bg-background hover:bg-accent/50 cursor-pointer transition-colors shadow-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:outline-none">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground capitalize">
                                    {dateRangePreset.replace('_', ' ')}
                                </span>
                            </div>
                        </SelectTrigger>
                        <SelectContent align="start">
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                            <SelectItem value="custom">Custom Range...</SelectItem>
                        </SelectContent>
                    </Select>

                    {dateRangePreset === 'custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200 z-40">
                            <DatePickerWithRange 
                                date={customRange} 
                                setDate={setCustomRange} 
                                className="h-9"
                            />
                        </div>
                    )}

                    {/* Group By Dropdown */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="flex items-center gap-2 px-3 py-1.5 border border-border/80 rounded-md bg-background hover:bg-accent/50 cursor-pointer transition-colors shadow-sm z-30">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">Group By</span>
                                <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm ml-1">
                                    {dimensions.length}
                                </span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-0" align="start">
                            <div className="p-2 border-b border-border/50">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dimensions</p>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input type="text" placeholder="Search..." className="w-full pl-8 pr-2 py-1.5 text-xs border border-border/60 rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto p-1">
                                {AVAILABLE_DIMENSIONS.map(dim => (
                                    <div 
                                        key={dim.id} 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDimension(dim.id); }}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer text-[13px]"
                                    >
                                        <div className={`h-4 w-4 rounded-sm border flex items-center justify-center ${dimensions.includes(dim.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                                            {dimensions.includes(dim.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                        <span>{dim.label}</span>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Metrics Dropdown */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="flex items-center gap-2 px-3 py-1.5 border border-border/80 rounded-md bg-background hover:bg-accent/50 cursor-pointer transition-colors shadow-sm z-30">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">Metrics</span>
                                <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm ml-1">
                                    {visibleMetrics.length}
                                </span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-0" align="start">
                            <div className="p-2 border-b border-border/50">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metrics</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto p-1">
                                {AVAILABLE_METRICS.map(metric => (
                                    <div 
                                        key={metric.id} 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMetric(metric.id); }}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer text-[13px]"
                                    >
                                        <div className={`h-4 w-4 rounded-sm border flex items-center justify-center ${visibleMetrics.includes(metric.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                                            {visibleMetrics.includes(metric.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                        <span>{metric.label}</span>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Add Filter Dropdown */}
                    <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-border/100 rounded-md bg-background hover:bg-accent/50 cursor-pointer transition-colors shadow-sm">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">Add Filter</span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3" align="start">
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Filter</p>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Field</label>
                                    <Select value={filterField} onValueChange={setFilterField}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AVAILABLE_DIMENSIONS.map(dim => (
                                                <SelectItem key={dim.id} value={dim.id} className="text-xs">
                                                    {dim.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Operator</label>
                                    <Select value={filterOperator} onValueChange={setFilterOperator}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="equals" className="text-xs">Equals</SelectItem>
                                            <SelectItem value="not_equals" className="text-xs">Not Equals</SelectItem>
                                            <SelectItem value="contains" className="text-xs">Contains</SelectItem>
                                            <SelectItem value="greater_than" className="text-xs">Greater Than</SelectItem>
                                            <SelectItem value="less_than" className="text-xs">Less Than</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Value</label>
                                    <Input 
                                        placeholder="Enter value..." 
                                        className="h-8 text-xs" 
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        onKeyDown={(e) => { if(e.key === 'Enter') addFilter(); }}
                                    />
                                </div>

                                <Button className="w-full h-8 text-xs mt-2" onClick={addFilter}>
                                    Apply Filter
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-border/80 shadow-sm" onClick={fetchDynamicData}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Run
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-border/80 shadow-sm" onClick={handleExportCSV}>
                        <Download className="h-3.5 w-3.5" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Active Filters Bar */}
            {filters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 border-x border-border/60 bg-muted/20">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1">Active Filters:</span>
                    {filters.map(filter => {
                        const fieldLabel = AVAILABLE_DIMENSIONS.find(d => d.id === filter.field)?.label || filter.field;
                        return (
                            <div 
                                key={filter.id}
                                className="flex items-center gap-1.5 px-2 py-1 bg-background border border-border/80 rounded-full text-[11px] shadow-sm animate-in zoom-in-95 duration-200"
                            >
                                <span className="font-semibold text-foreground">{fieldLabel}</span>
                                <span className="text-muted-foreground">{filter.operator.replace('_', ' ')}</span>
                                <span className="font-bold text-primary italic">"{filter.value}"</span>
                                <button 
                                    onClick={() => removeFilter(filter.id)}
                                    className="ml-0.5 p-0.5 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    })}
                    <button 
                        onClick={() => setFilters([])}
                        className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors ml-2 uppercase"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Table Area */}
            <div className="border border-t-0 border-border/60 rounded-b-xl bg-card overflow-hidden relative shadow-sm">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
                    
                <div className="overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-b border-border/50">
                                {/* Dynamic Dimension Columns */}
                                {dimensions.map(dim => {
                                    const label = AVAILABLE_DIMENSIONS.find(d => d.id === dim)?.label;
                                    return (
                                        <TableHead 
                                            key={dim} 
                                            className="font-semibold text-muted-foreground text-xs uppercase cursor-pointer hover:bg-accent/50 transition-colors py-3 whitespace-nowrap"
                                            onClick={() => handleSort(dim)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {label}
                                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                                            </div>
                                        </TableHead>
                                    );
                                })}
                                
                                {/* Metric Columns */}
                                {visibleMetrics.includes('total_leads') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('total_leads')}>
                                    <div className="flex items-center justify-end gap-1">Total Leads <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                                {visibleMetrics.includes('sold_leads') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('sold_leads')}>
                                    <div className="flex items-center justify-end gap-1">Sold Leads <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                                {visibleMetrics.includes('conversion_rate') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('conversion_rate')}>
                                    <div className="flex items-center justify-end gap-1">% Lead Sold <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                                {visibleMetrics.includes('email_good_rate') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('email_good_rate')}>
                                    <div className="flex items-center justify-end gap-1">% Email Good <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                                {visibleMetrics.includes('ip_good_rate') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('ip_good_rate')}>
                                    <div className="flex items-center justify-end gap-1">% IP Good <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                                {visibleMetrics.includes('phone_good_rate') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('phone_good_rate')}>
                                    <div className="flex items-center justify-end gap-1">% Phone Good <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                                {visibleMetrics.includes('redirection_rate') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('redirection_rate')}>
                                    <div className="flex items-center justify-end gap-1">% Redirection <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                                {visibleMetrics.includes('avg_price') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('avg_price')}>
                                    <div className="flex items-center justify-end gap-1">Avg. Price <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                                {visibleMetrics.includes('revenue') && <TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase cursor-pointer py-3 whitespace-nowrap" onClick={() => handleSort('revenue')}>
                                    <div className="flex items-center justify-end gap-1">Revenue <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dimensions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center text-muted-foreground h-32 italic">
                                        Select at least one dimension to group data.
                                    </TableCell>
                                </TableRow>
                            ) : sortedData.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center text-muted-foreground h-32 italic">
                                        No data available for the selected dimensions and date range.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {sortedData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-accent/30 transition-colors border-b border-border/40">
                                            {/* Dynamic Dimension Cells */}
                                            {dimensions.map(dim => {
                                                let cellValue = row[dim];
                                                if (dim === 'buyer') {
                                                    cellValue = row.buyer_name || row.buyer || 'Unknown Buyer';
                                                }
                                                if (dim === 'date') {
                                                    // Minimal format
                                                    cellValue = cellValue || 'Unknown Date';
                                                }
                                                return (
                                                    <TableCell key={dim} className="font-medium text-foreground py-4">
                                                        {cellValue || 'N/A'}
                                                    </TableCell>
                                                );
                                            })}
                                            
                                            {/* Metric Cells */}
                                            {visibleMetrics.includes('total_leads') && <TableCell className="text-right tabular-nums py-4">{row.total_leads.toLocaleString()}</TableCell>}
                                            {visibleMetrics.includes('sold_leads') && <TableCell className="text-right tabular-nums py-4">{row.sold_leads.toLocaleString()}</TableCell>}
                                            {visibleMetrics.includes('conversion_rate') && <TableCell className="text-right tabular-nums font-medium text-blue-600 dark:text-blue-400 py-4">
                                                {row.conversion_rate.toFixed(1)}%
                                            </TableCell>}
                                            {visibleMetrics.includes('email_good_rate') && <TableCell className="text-right tabular-nums py-4">
                                                {row.email_good_rate.toFixed(1)}%
                                            </TableCell>}
                                            {visibleMetrics.includes('ip_good_rate') && <TableCell className="text-right tabular-nums py-4">
                                                {row.ip_good_rate.toFixed(1)}%
                                            </TableCell>}
                                            {visibleMetrics.includes('phone_good_rate') && <TableCell className="text-right tabular-nums py-4">
                                                {row.phone_good_rate.toFixed(1)}%
                                            </TableCell>}
                                            {visibleMetrics.includes('redirection_rate') && <TableCell className="text-right tabular-nums font-medium text-orange-500 py-4">
                                                {row.redirection_rate.toFixed(1)}%
                                            </TableCell>}
                                            {visibleMetrics.includes('avg_price') && <TableCell className="text-right tabular-nums py-4">
                                                ${row.avg_price.toFixed(2)}
                                            </TableCell>}
                                            {visibleMetrics.includes('revenue') && <TableCell className="text-right font-bold text-green-600 dark:text-green-400 tabular-nums py-4">
                                                ${row.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>}
                                        </TableRow>
                                    ))}
                                    
                                    {/* Total Values Row */}
                                    {data.length > 0 && (
                                        <TableRow className="bg-muted/30 font-bold hover:bg-muted/40 transition-colors">
                                            <TableCell colSpan={dimensions.length} className="text-left py-4">
                                                Total
                                            </TableCell>
                                            {visibleMetrics.includes('total_leads') && <TableCell className="text-right tabular-nums py-4">{totals.total_leads.toLocaleString()}</TableCell>}
                                            {visibleMetrics.includes('sold_leads') && <TableCell className="text-right tabular-nums py-4">{totals.sold_leads.toLocaleString()}</TableCell>}
                                            {visibleMetrics.includes('conversion_rate') && <TableCell className="text-right tabular-nums py-4 text-blue-600 dark:text-blue-400">{aggregateRates.conversion_rate.toFixed(1)}%</TableCell>}
                                            {visibleMetrics.includes('email_good_rate') && <TableCell className="text-right tabular-nums py-4">{aggregateRates.email_good_rate.toFixed(1)}%</TableCell>}
                                            {visibleMetrics.includes('ip_good_rate') && <TableCell className="text-right tabular-nums py-4">{aggregateRates.ip_good_rate.toFixed(1)}%</TableCell>}
                                            {visibleMetrics.includes('phone_good_rate') && <TableCell className="text-right tabular-nums py-4">{aggregateRates.phone_good_rate.toFixed(1)}%</TableCell>}
                                            {visibleMetrics.includes('redirection_rate') && <TableCell className="text-right tabular-nums py-4 text-orange-500">{aggregateRates.redirection_rate.toFixed(1)}%</TableCell>}
                                            {visibleMetrics.includes('avg_price') && <TableCell className="text-right tabular-nums py-4">${aggregateRates.avg_price.toFixed(2)}</TableCell>}
                                            {visibleMetrics.includes('revenue') && <TableCell className="text-right tabular-nums py-4 text-green-600 dark:text-green-400">
                                                ${totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>}
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
