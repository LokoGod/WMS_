import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import ShelfMapPage from '@/components/shelf/ShelfMapPage';

const ShelfMap = () => {
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/shelf/create" name="Add New Shelf" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ShelfMapPage title="Shelf Map" />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ShelfMap;
