import { NextResponse } from "next/server";

import { generateInvoice } from "@/utilities/invoice/generateInvoice";

export async function POST() {
    const pdfBuffer = generateInvoice({
        userName: "demo",
        email: "demo@example.com",
        plan: "BRONZE",
        amount: 100,
        purchaseDate: "2026-07-03",
        paymentId: "pay_test123",
        orderId: "order_test123",
    });

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'inline; filename="twitter-clone-invoice.pdf"',
        },
    });
}
