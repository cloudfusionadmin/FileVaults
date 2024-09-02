// components/StorageChart.tsx

import { useEffect, useRef } from 'react';
import Chart, { ChartType, ChartData, ChartOptions } from 'chart.js/auto';

interface StorageChartProps {
  used: number;
  capacity: number;
}

export default function StorageChart({ used, capacity }: StorageChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart<'doughnut'> | null>(null); // Ref to hold the chart instance

  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d');
    if (ctx) {
      // Destroy existing chart instance if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      // Create a new chart instance
      chartInstanceRef.current = new Chart<'doughnut'>(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Used Storage', 'Free Storage'],
          datasets: [
            {
              data: [used, capacity - used],
              backgroundColor: ['#FF6384', '#36A2EB'],
              hoverBackgroundColor: ['#FF6384', '#36A2EB'],
            },
          ],
        },
        options: {
          maintainAspectRatio: false, // Disable default aspect ratio
          plugins: {
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return tooltipItem.label + ': ' + tooltipItem.raw + ' GB';
                },
              },
            },
          },
        } as ChartOptions<'doughnut'>, // Ensure options are typed correctly
      });
    }

    // Cleanup the chart instance when the component is unmounted or re-rendered
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [used, capacity]);

  return <canvas ref={chartRef} style={{ width: '150px', height: '150px' }} />; // Set chart size
}
