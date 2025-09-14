import React , {useMemo} from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import ProductTable from '@/components/products/ProductTable';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';

const Products = () => {
    const isAdmin = useMemo(() => {
        try {
          const t = (localStorage.getItem('userType') || '').toLowerCase();
          return t === 'admin';
        } catch {
          return false;
        }
      }, []);
    
      if (!isAdmin) {
        return (
          <>
            <PageHeader />
            <div className="main-content">
              <div className="row">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                      <h3 className="mb-2">Access Denied</h3>
                      <p className="text-muted mb-0">
                        You don’t have permission to view this page. Admin access is required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </>
        );
      }
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/set-product/create" name="Assign New Product" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ProductTable title="Set Product List" />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Products;
