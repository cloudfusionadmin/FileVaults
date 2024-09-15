// components/StorageChart.tsx

import { useEffect, useRef } from 'react';
import Chart, { ChartOptions } from 'chart.js/auto';

interface StorageChartProps {
  used: number;
  capacity: number;
}

export default function StorageChart({ used, capacity }: StorageChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart<'doughnut'> | null>(null);

  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d');
    if (ctx) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const freeStorage = Math.max(capacity - used, 0); // Ensure no negative values

      chartInstanceRef.current = new Chart<'doughnut'>(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Used Storage', 'Free Storage'],
          datasets: [
            {
              data: [used, freeStorage],
              backgroundColor: ['#FF6384', '#36A2EB'],
              hoverBackgroundColor: ['#FF6384', '#36A2EB'],
            },
          ],
        },
        options: {
          responsive: true, // Make the chart responsive
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${tooltipItem.label}: ${tooltipItem.raw} GB`;
                },
              },
            },
          },
        } as ChartOptions<'doughnut'>,
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [used, capacity]);

  return <canvas ref={chartRef} style={{ width: '150px', height: '150px' }} />;
}
