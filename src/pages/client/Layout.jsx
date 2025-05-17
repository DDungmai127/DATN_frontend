import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/client/Header";
import Footer from "../../components/client/Footer";
import CategoryBar from "../../components/client/CategoryBar";

const Layout_Client = ({ children }) => {
  console.log("Layout_Client rendered");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <CategoryBar></CategoryBar>
      <main className="flex-grow">{children || <Outlet />}</main>
      <Footer />
    </div>
  );
};

export default Layout_Client;
