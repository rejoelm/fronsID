import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

interface CheckoutRequest {
  user_id: string;
  package_id: string;
  credits: number;
  amount: number;
}

const CREDIT_PACKAGES: Record<
  string,
  { credits: number; amount: number; name: string }
> = {
  starter: { credits: 100, amount: 99, name: "Starter Pack — 100 Credits" },
  basic: { credits: 500, amount: 399, name: "Basic Pack — 500 Credits" },
  standard: {
    credits: 1500,
    amount: 999,
    name: "Standard Pack — 1,500 Credits",
  },
  pro: { credits: 5000, amount: 2999, name: "Pro Pack — 5,000 Credits" },
  enterprise: {
    credits: 20000,
    amount: 9999,
    name: "Enterprise Pack — 20,000 Credits",
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
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

    // Validate amount and credits match the package
    if (
      (credits && credits !== pkg.credits) ||
      (amount && amount !== pkg.amount)
    ) {
      return NextResponse.json(
        { error: "Package details mismatch" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://frons.id";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} FRONS credits for research queries`,
            },
            unit_amount: pkg.amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/credits?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/credits?status=cancelled`,
      metadata: {
        user_id,
        package_id,
        credits: pkg.credits.toString(),
      },
    });

    return NextResponse.json({
      checkout_url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
