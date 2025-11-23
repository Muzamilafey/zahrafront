import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function PharmacyLayout(){
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-gradient-to-b from-green-600 to-green-500 text-white rounded-tr-3xl rounded-br-3xl p-6 hidden md:block">
        <div className="mb-6">
          <div className="text-3xl font-bold">LOGO</div>
          <div className="text-sm opacity-90">PHARMACY</div>
        </div>
        <nav className="mt-6 space-y-2">
          <Link to="/pharmacy" className="block py-2 px-3 rounded hover:bg-white hover:text-green-600">Dashboard</Link>
          <Link to="/pharmacy/pos" className="block py-2 px-3 rounded hover:bg-white hover:text-green-600">POS</Link>
          <Link to="/pharmacy/dispense" className="block py-2 px-3 rounded hover:bg-white hover:text-green-600">Dispense Requests</Link>
          <Link to="/pharmacy/reverse" className="block py-2 px-3 rounded hover:bg-white hover:text-green-600">Reverse Confirmed</Link>
          <Link to="/pharmacy/injections" className="block py-2 px-3 rounded hover:bg-white hover:text-green-600">Injections</Link>
          <Link to="/pharmacy/inventory" className="block py-2 px-3 rounded hover:bg-white hover:text-green-600">Inventory</Link>
          <Link to="/pharmacy/register-drugs" className="block py-2 px-3 rounded hover:bg-white hover:text-green-600">Register Drugs</Link>
          <Link to="/pharmacy/sales-report" className="block py-2 px-3 rounded hover:bg-white hover:text-green-600">Sales Report</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <div className="hidden md:block text-center w-full">
              <div className="text-2xl font-semibold">PHARMACY</div>
            </div>
          </header>

          <section>
            <Outlet />
          </section>
        </div>
      </main>
    </div>
  );
}
