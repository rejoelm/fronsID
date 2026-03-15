import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

interface XenditCheckoutRequest {
  user_id: string;
  package_id: string;
  credits: number;
  amount: number;
}

const CREDIT_PACKAGES: Record<
  string,
  { credits: number; amount_idr: number; name: string }
> = {
  starter: {
    credits: 100,
    amount_idr: 15000,
    name: "Starter Pack — 100 Credits",
  },
  basic: {
    credits: 500,
    amount_idr: 60000,
    name: "Basic Pack — 500 Credits",
  },
  standard: {
    credits: 1500,
    amount_idr: 150000,
    name: "Standard Pack — 1,500 Credits",
  },
  pro: {
    credits: 5000,
    amount_idr: 450000,
    name: "Pro Pack — 5,000 Credits",
  },
  enterprise: {
    credits: 20000,
    amount_idr: 1500000,
    name: "Enterprise Pack — 20,000 Credits",
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: XenditCheckoutRequest = await request.json();
    const { user_id, package_id, credits, amount } = body;

    if (!user_id || !package_id) {
      return NextResponse.json(
        { error: "Missing required fields: user_id and package_id" },
        { status: 400 }
      );
    }

    const pkg = CREDIT_PACKAGES[package_id];
    if (!pkg) {
      return NextResponse.json(
        { error: "Invalid package_id" },
        { status: 400 }
      );
    }

    const xenditSecretKey = process.env.XENDIT_SECRET_KEY;
    if (!xenditSecretKey) {
      return NextResponse.json(
        { error: "Payment provider not configured" },
        { status: 503 }
      );
    }

    const externalId = `frons-${user_id}-${Date.now()}`;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://frons.id";

    const invoicePayload = {
      external_id: externalId,
      amount: amount || pkg.amount_idr,
      currency: "IDR",
      description: pkg.name,
      payer_email: undefined as string | undefined,
      success_redirect_url: `${baseUrl}/credits?status=success`,
      failure_redirect_url: `${baseUrl}/credits?status=failed`,
      payment_methods: [
        "QRIS",
        "ID_OVO",
        "ID_DANA",
        "ID_SHOPEEPAY",
        "ID_GOPAY",
      ],
      metadata: {
        user_id,
        package_id,
        credits: pkg.credits,
      },
    };

    // Look up user email if available
    const { data: userData } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", user_id)
      .single();

    if (userData?.email) {
      invoicePayload.payer_email = userData.email;
    }

    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(xenditSecretKey + ":").toString("base64")}`,
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Xendit invoice creation failed:", errorData);
      return NextResponse.json(
        { error: "Failed to create payment invoice" },
        { status: 502 }
      );
    }

    const invoice = await response.json();

    return NextResponse.json({
      checkout_url: invoice.invoice_url,
    });
  } catch (error) {
    console.error("Xendit checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
