import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export async function GET() {
    try {
        const imagekit = new ImageKit({
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "dummy_public_key",
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy_private_key",
            urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/dummy",
        });

        const authenticationParameters = imagekit.getAuthenticationParameters();
        return NextResponse.json(authenticationParameters);
    } catch (error) {
        return NextResponse.json(
            { error: "ImageKit Auth Failed" },
            { status: 500 }
        );
    }
}
