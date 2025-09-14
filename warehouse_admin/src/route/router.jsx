import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import Home from "../pages/home";
import LayoutAuth from "../layout/layoutAuth";
import LoginCreative from "../pages/login-creative";
import ResetCreative from "../pages/reset-creative";

//--------------------------------------------------
import PrivateRoute from "../utils/PrivateRoute";
import UserDetails from "../pages/user/user-details";

import Products from "../pages/products/products";
import AddProducts from "../pages/products/add-products";
import UpdateProducts from "../pages/products/update-products";
import Shelf from "../pages/shelf/shelf";
import AddShelf from "../pages/shelf/add-shelf";
import UpdateShelf from "../pages/shelf/update-shelf";
import ShelfCat from "../pages/shelf-cat/shelfcat";
import AddShelfCat from "../pages/shelf-cat/add-shelfcat";
import UpdateShelfCat from "../pages/shelf-cat/update-shelfcat";
import ProductDetails from "../pages/product-details/product-details";
import AddProductDetails from "../pages/product-details/add-product-details";
import UpdateProductDetails from "../pages/product-details/update-product-details";
import FireMonitoringPage from "../pages/fire-monitoring/FireMonitoring";
import Stock from "../pages/inbound-outbound/stock";
import Outbound from "../pages/inbound-outbound/outbound";
import Inbound from "../pages/inbound-outbound/inbound";
import UpdatePerformance from "../pages/performance/performance-update";
import ShelfOpt from "../pages/shelf-opt/shelf-opt";
import RouteOptimization from "../pages/route-optimization/route-opt";
import ShelfMap from "../pages/shelf/shelf-map";
import Forecasting from "../pages/inbound-outbound/forecasting";
import Register from "../pages/register";

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <PrivateRoute>
              <RootLayout />
            </PrivateRoute>
          ),
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/admin/shelf",
                element: <Shelf />
            },
            {
                path: "/admin/shelf-map",
                element: <ShelfMap />
            },
            {
                path: "/admin/shelf/create",
                element: <AddShelf />
            },
            {
                path: "/admin/shelf/edit/:id",
                element: <UpdateShelf />
            },
            {
                path: "/admin/shelfcat",
                element: <ShelfCat />
            },
            {
                path: "/admin/shelfcat/create",
                element: <AddShelfCat />
            },
            {
                path: "/admin/shelfcat/edit/:id",
                element: <UpdateShelfCat />
            },
            {
                path: "/admin/products",
                element: <ProductDetails />
            },
            {
                path: "/admin/product/create",
                element: <AddProductDetails />
            },
            {
                path: "/admin/product/edit/:id",
                element: <UpdateProductDetails />
            },
            {
                path: "/admin/set-product",
                element: <Products />
            },
            {
                path: "/admin/set-product/create",
                element: <AddProducts />
            },
            {
                path: "/admin/set-product/edit/:id",
                element: <UpdateProducts />
            },
            {
                path: "/admin/user-list",
                element: <UserDetails />
            },

            {
                path: "/admin/fire-monitoring",
                element: <FireMonitoringPage />
            },
            {
                path: "/admin/stock",
                element: <Stock />
            },
            {
                path: "/admin/outbound",
                element: <Outbound />
            },
            {
                path: "/admin/inbound",
                element: <Inbound />
            },
            {
                path: "/admin/forecasting",
                element: <Forecasting />
            },
            {
                path: "/admin/update-performance",
                element: <UpdatePerformance />
            },
            {
                path: "/admin/shelf-opt",
                element: <ShelfOpt />
            },
            {
                path: "/admin/route-opt",
                element: <RouteOptimization />
            },
            
        ]
    },
    {
        path: "/",
        element: <LayoutAuth />,
        children: [
            {
                path: "/authentication/login/creative",
                element: <LoginCreative />
            },
            {
                path: "/authentication/register/",
                element: <Register />
            },
            {
                path: "/authentication/reset/creative",
                element: <ResetCreative />
            },
        ]
    }
])