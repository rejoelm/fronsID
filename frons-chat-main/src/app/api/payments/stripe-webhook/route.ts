import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || "0", 10);
      const packageId = session.metadata?.package_id || "";

      if (!userId || credits <= 0) {
        console.error("Invalid session metadata:", session.metadata);
        return NextResponse.json(
          { error: "Invalid session metadata" },
          { status: 400 }
        );
      }

      // Add credits to user's balance
      const { error: creditError } = await supabaseAdmin.rpc("add_credits", {
        p_user_id: userId,
        p_amount: credits,
        p_reason: "stripe_purchase",
        p_reference_id: session.id,
        p_package_id: packageId,
      });

      if (creditError) {
        console.error("Failed to add credits:", creditError);
        return NextResponse.json(
          { error: "Failed to add credits" },
          { status: 500 }
        );
      }

      console.log(
        `Added ${credits} credits to user ${userId} via Stripe (session: ${session.id})`
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
