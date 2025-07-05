import React, { useEffect, useRef } from "react";

function KakaoMap() {
  const mapRef = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=62eaef5cdf4fff97f7b8ef5b4379b6c2&autoload=false";
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.501250, 127.060036), // IG수학 위치로 수정!
          level: 3
        });
        // 마커
        new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(37.501250, 127.060036) // IG수학 위치로 수정!
        });
      });
    };
    document.head.appendChild(script);
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: 350, borderRadius: 12, margin: "16px 0" }} />
      <div style={{ textAlign: "right" }}>
        <a href="https://map.kakao.com/link/to/IG수학,37.501250, 127.060036" target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-block", background: "#FEE500", color: "#181600", fontWeight: "bold",
            padding: "8px 18px", borderRadius: 20, textDecoration: "none", marginTop: 10
          }}>
          카카오맵 길찾기
        </a>
      </div>
    </div>
  );
}

export default KakaoMap;