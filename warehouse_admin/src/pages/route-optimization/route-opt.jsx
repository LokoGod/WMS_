import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import PathOptimization from '@/components/route-optimization/PathOptimization';

const RouteOptimization = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <PathOptimization title={"Route Optimization"} />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default RouteOptimization;