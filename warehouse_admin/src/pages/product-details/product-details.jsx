import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import ProductDetailsTable from '@/components/product-details/ProductDetailsTable';

const ProductDetails = () => {
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/product/create" name="Add New Products" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ProductDetailsTable title="Product List" />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ProductDetails;
