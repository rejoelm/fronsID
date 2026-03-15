import { NextRequest, NextResponse } from "next/server";
import { validateNfcTap } from "@/lib/nfc-auth";
import { supabaseServer } from "@/lib/supabase";

/**
 * GET /api/verify-tap?slug={slug}&cmac={cmac}&ctr={counter}
 *
 * Validates an NFC tap from an NTAG 424 DNA card and returns the
 * associated researcher profile if authentication succeeds.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const cmac = searchParams.get("cmac");
  const ctr = searchParams.get("ctr");

  // Validate required parameters
  if (!slug || !cmac || !ctr) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required parameters: slug, cmac, ctr",
      },
      { status: 400 }
    );
  }

  // Validate the NFC tap CMAC
  const validation = await validateNfcTap(slug, cmac, ctr, supabaseServer);

  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error,
      },
      { status: 403 }
    );
  }

  // Fetch the researcher profile associated with the card
  const { data: profile, error: profileError } = await supabaseServer
    .from("researcher_profiles")
    .select(
      `
      id,
      wallet_address,
      display_name,
      title,
      institution,
      location,
      specializations,
      about,
      profile_slug,
      avatar_url,
      h_index,
      total_citations,
      papers_published,
      datasets_published,
      verified_scholar,
      researcher_id
    `
    )
    .eq("profile_slug", slug)
    .single();

  if (profileError || !profile) {
    // Card is valid but profile not found - still return success with card info
    return NextResponse.json({
      success: true,
      verified: true,
      cardId: validation.cardId,
      tapCount: validation.tapCount,
      profile: null,
      message: "Card authenticated but no profile found for this slug",
    });
  }

  // Fetch recent publications for the profile
  const { data: papers } = await supabaseServer
    .from("articles")
    .select("id, doci, title, status, citation_count, published_at")
    .eq("primary_author_wallet", profile.wallet_address)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    success: true,
    verified: true,
    cardId: validation.cardId,
    tapCount: validation.tapCount,
    profile: {
      ...profile,
      recentPapers: papers || [],
    },
  });
}
