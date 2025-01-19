import React from "react";

const Payslip = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-50 shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-4">PAYSLIP</h1>

      <div className="mb-6">
        <p className="text-lg font-semibold">Name:</p>
        <p className="text-lg">Continental Fitness Gym</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-lg font-semibold">Total:</p>
        </div>
        <div>
          <p className="text-lg font-semibold">Tax:</p>
        </div>
        <div>
          <p className="text-lg font-semibold">Subtotal:</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Computation of Salary</h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-lg">Daily Rate:</p>
            <p className="text-lg">No. of hours worked:</p>
            <p className="text-lg">No. of days absent:</p>
            <p className="text-lg">No. of tardiness:</p>
            <p className="text-lg">Deductions:</p>
          </div>
          <div>
            <p className="text-lg">Date issued:</p>
            <p className="text-lg">Salary for the month of:</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-lg font-semibold">Prepared By:</p>
        <p className="text-lg font-semibold">Received By:</p>
        <p className="mt-4">
          This is to certify that I, ______________________ , have received the correct amount of
          pay/salary for the month of ___________________.
        </p>
      </div>
    </div>
  );
};

export default Payslip;
