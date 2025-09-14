import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';

const PaymentRecordChart = () => {
    const [chartOptions, setChartOptions] = useState({});
    const [summary, setSummary] = useState({
        placed: { count: 0, amount: 0 },
        confirmed: { count: 0, amount: 0 },
        cancelled: { count: 0, amount: 0 },
        revenue: 0,
    });

    const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } = useCardTitleActions();

    useEffect(() => {
        fetchAndProcessOrders();
        // eslint-disable-next-line
    }, [refreshKey]);

    async function fetchAndProcessOrders() {
        try {
            const token = getToken();
            const res = await axios.get(`${BASE_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } });
            const orders = res.data;

            // 1. Group by month and status
            const grouped = groupOrdersByMonth(orders);
            const months = Object.keys(grouped).sort();

            // 2. Prepare chart series
            const placedSeries = months.map(month => grouped[month].placed.amount);
            const confirmedSeries = months.map(month => grouped[month].confirmed.amount);
            const cancelledSeries = months.map(month => grouped[month].cancelled.amount);

            // 3. Prepare chart options
            setChartOptions({
                chart: { type: 'line', height: 350 },
                series: [
                    { name: 'Placed', data: placedSeries },
                    { name: 'Confirmed', data: confirmedSeries },
                    { name: 'Cancelled', data: cancelledSeries }
                ],
                xaxis: { categories: months },
                yaxis: { labels: { formatter: val => `Rs. ${Number(val).toLocaleString()}` } }
            });

            // 4. Calculate summary
            const summaryObj = {
                placed: { count: 0, amount: 0 },
                confirmed: { count: 0, amount: 0 },
                cancelled: { count: 0, amount: 0 },
                revenue: 0,
            };
            orders.forEach(order => {
                const status = (order.status || '').toLowerCase();
                const amount = Number(order.purchasePrice?.$numberDecimal || 0);
                if (status === 'placed') {
                    summaryObj.placed.count++;
                    summaryObj.placed.amount += amount;
                }
                if (status === 'confirmed') {
                    summaryObj.confirmed.count++;
                    summaryObj.confirmed.amount += amount;
                    summaryObj.revenue += amount;
                }
                if (status === 'cancelled') {
                    summaryObj.cancelled.count++;
                    summaryObj.cancelled.amount += amount;
                }
            });
            setSummary(summaryObj);

        } catch (e) {
            setChartOptions({});
        }
    }

    function groupOrdersByMonth(orders) {
        const result = {};
        orders.forEach(order => {
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const status = (order.status || '').toLowerCase();
            const amount = Number(order.purchasePrice?.$numberDecimal || 0);

            if (!result[monthKey]) {
                result[monthKey] = { placed: { count: 0, amount: 0 }, confirmed: { count: 0, amount: 0 }, cancelled: { count: 0, amount: 0 } };
            }
            if (status === 'placed' || status === 'confirmed' || status === 'cancelled') {
                result[monthKey][status].count += 1;
                result[monthKey][status].amount += amount;
            }
        });
        return result;
    }

    if (isRemoved) return null;

    return (
        <div className="col-xxl-8">
            <div className={`card stretch stretch-full ${isExpanded ? "card-expand" : ""} ${refreshKey ? "card-loading" : ""}`}>
                <CardHeader title={"Payment Record"} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />
                <div className="card-body custom-card-action p-0">
                    {chartOptions.series &&
                        <ReactApexChart
                            options={chartOptions}
                            series={chartOptions.series}
                            height={377}
                        />
                    }
                </div>
                <div className="card-footer">
                    <div className="row g-4">
                        <Card bg_color={"bg-primary"} price={summary.placed.amount.toLocaleString()} progress={"100%"} title={`Placed (${summary.placed.count})`} />
                        <Card bg_color={"bg-success"} price={summary.confirmed.amount.toLocaleString()} progress={"100%"} title={`Confirmed (${summary.confirmed.count})`} />
                        <Card bg_color={"bg-danger"} price={summary.cancelled.amount.toLocaleString()} progress={"100%"} title={`Cancelled (${summary.cancelled.count})`} />
                        <Card bg_color={"bg-dark"} price={summary.revenue.toLocaleString()} progress={"100%"} title={"Total Revenue"} />
                    </div>
                </div>
                <CardLoader refreshKey={refreshKey} />
            </div>
        </div>
    )
}

export default PaymentRecordChart

const Card = ({ title, price, progress, bg_color }) => (
    <div className="col-lg-3">
        <div className="p-3 border border-dashed rounded">
            <div className="fs-12 text-muted mb-1">{title}</div>
            <h6 className="fw-bold text-dark">Rs. {price}</h6>
            <div className="progress mt-2 ht-3">
                <div className={`progress-bar ${bg_color}`} role="progressbar" style={{ width: progress }}></div>
            </div>
        </div>
    </div>
);
