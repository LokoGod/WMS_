import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import UpdateProductDetailsForm from '@/components/product-details/UpdateProductDetailsForm';

const UpdateProductDetails = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdateProductDetailsForm title={"Update Products"} />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default UpdateProductDetails;