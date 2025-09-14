import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import AddProductDetailsForm from '@/components/product-details/AddProductDetailsForm';

const AddProductDetails = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddProductDetailsForm title={"Add Product"} />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default AddProductDetails;