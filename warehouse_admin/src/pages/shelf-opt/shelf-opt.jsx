import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import ShelfOptfForm from '@/components/shelf-opt/shelfOptForm';

const ShelfOpt = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ShelfOptfForm title={"shelf Optimization"} />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default ShelfOpt;