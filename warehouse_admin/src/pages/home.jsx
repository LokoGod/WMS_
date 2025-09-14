import React from 'react'
import PaymentRecordChart from '@/components/widgetsCharts/PaymentRecordChart'
import SiteOverviewStatistics from '@/components/widgetsStatistics/SiteOverviewStatistics'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'


const Home = () => {
    return (
        <>
            <PageHeader/>
            <div className='main-content'>
                <div className='row'>
                    <SiteOverviewStatistics />
                    {/* <PaymentRecordChart /> */}
                    
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Home