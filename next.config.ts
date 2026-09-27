import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image는 허용한 외부 호스트의 이미지만 최적화한다.
    // 아무 주소나 허용하면 남의 이미지를 우리 서버 자원으로 변환해주는 통로가 되므로 호스트와 경로를 좁혀둔다.
    // 이미지 소스가 확정되면 여기에 해당 호스트를 추가한다.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-**",
      },
    ],
  },
};

export default nextConfig;
