"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
// Note: Shadcn 'table' component might not be installed yet. I will check or just use standard HTML table classes with Tailwind for simplicity if table component is missing.
// Note: Shadcn 'table' component might not be installed yet. I will check or just use standard HTML table classes with Tailwind for simplicity if table component is missing. 
// Actually I didn't install 'table' component in shadcn earlier. I should probably add it or just style it manually. 
// To be safe and quick, I will use manual Tailwind table styles or install the table component. 
// Let's run the shadcn add table command in parallel or just use standard HTML. Standard HTML is faster for now.

export function DataViewer() {
    const [data, setData] = useState<string[][]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/data/data.csv")
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    complete: (result) => {
                        setData(result.data as string[][]);
                        setLoading(false);
                    },
                    header: false, // File has complex headers, so we treat everything as rows
                    skipEmptyLines: true,
                });
            })
            .catch((err) => {
                console.error("Failed to load CSV", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-4 text-center">Loading Data...</div>;

    return (
        <div className="rounded-md border overflow-x-auto max-h-[80vh]">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 whitespace-nowrap">
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex < 2 ? "bg-slate-100 font-bold" : "hover:bg-slate-50"}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 border-r border-gray-100 last:border-r-0">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
