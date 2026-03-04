// =============================
// 전역 상태: 지도 / 경로 / 핀
// =============================
let map = null;
let polyline = null;
// 🔥 경로상의 각 점: { coord: LatLng, marker: Marker }
let pathPoints = [];   // 예: [{ coord: LatLng, marker: Marker }, ...]

// =============================
// 페이지 로드 후: 지도 초기화 세팅
// =============================
window.addEventListener("DOMContentLoaded", () => {
  const pinButton   = document.getElementById("pinBtn");          // "핀으로 코스 표시" 버튼
  const mapWrapper  = document.getElementById("naverMapWrapper"); // .map div
  const mapBackImg  = document.querySelector(".map-back");        // 배경 이미지
  const btnArea     = document.querySelector(".btn-area");        // 버튼 묶음

  // 🔹 경로(열린 상태) 다시 그리기
  function updatePolyline() {
    if (!polyline) return;
    const coords = pathPoints.map(p => p.coord);
    polyline.setPath(coords);
  }

  // 🔹 두 좌표 간 거리(m 단위) 계산
  function distance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 지구 반지름(m)
    const toRad = v => v * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 🔹 더블클릭한 위치가 시작점 근처면 루프 닫기
  function closeLoopIfNear(coord) {
    if (!polyline) return;
    if (pathPoints.length < 2) return;

    const first = pathPoints[0].coord;

    // 시작점과 더블클릭 지점 사이 거리 (m)
    const dist = distance(first.y, first.x, coord.y, coord.x);

    // 🔥 30m 이내면 같은 지점으로 간주 → 루프 닫기
    if (dist < 30) {
      const coords = pathPoints.map(p => p.coord);
      polyline.setPath([...coords, first]);  // 화면상에서만 루프 닫기
    }
  }

  // 지도 초기화 함수 (한 번만 실행)
  function initMap() {
    if (map || !mapWrapper) return; // 이미 있으면 다시 만들지 않음

    // 1) 기존 배경 이미지/버튼 제거
    if (mapBackImg) mapBackImg.remove();
    if (btnArea) btnArea.remove();

    // 2) 네이버 지도가 들어갈 div 만들기
    const mapDiv = document.createElement("div");
    mapDiv.id = "naverMap";
    mapDiv.style.width = "100%";
    mapDiv.style.height = "100%";
    mapWrapper.appendChild(mapDiv);

    // 3) 지도 생성 (서울 시청 근처)
    const center = new naver.maps.LatLng(37.55060, 126.9408);
    map = new naver.maps.Map(mapDiv, {
      center: center,
      zoom: 15,
      draggable: true,
      pinchZoom: true,
      scrollWheel: true,
      keyboardShortcuts: true,
      disableKineticPan: false
    });

    // 4) 경로 그리기용 폴리라인
    polyline = new naver.maps.Polyline({
      map: map,
      path: [],                    // 처음엔 빈 경로
      strokeColor: "#f2ca66",
      strokeOpacity: 0.9,
      strokeWeight: 5
    });

    // 5) 지도 클릭하면 핀 + 경로 추가 (싱글 클릭)
    naver.maps.Event.addListener(map, "click", (e) => {
      const coord = e.coord;   // LatLng

      // 5-1) 네 커스텀 SVG 아이콘으로 마커 생성
      const marker = new naver.maps.Marker({
        position: coord,
        map: map,
        icon: {
          // 🔥 실제 경로에 맞게 수정 (지금 경로 기준)
          url: "./element/upload course/SVG/pin.svg",
          size: new naver.maps.Size(32, 32),
          scaledSize: new naver.maps.Size(32, 32),
          anchor: new naver.maps.Point(16, 32)
        }
      });

      // 5-2) 경로 배열에 {coord, marker} 세트로 저장
      pathPoints.push({ coord, marker });

      // 5-3) 열린 경로로 폴리라인 갱신
      updatePolyline();

      // 5-4) 마커 클릭하면 해당 점 삭제 (싱글 클릭 = 삭제)
      naver.maps.Event.addListener(marker, "click", () => {
        const idx = pathPoints.findIndex(p => p.marker === marker);
        if (idx !== -1) {
          pathPoints.splice(idx, 1);
        }

        marker.setMap(null);  // 지도에서 마커 제거
        updatePolyline();
      });
    });

    // 6) 지도 더블클릭하면 "시작점 근처인지" 확인해서 루프 닫기
    naver.maps.Event.addListener(map, "dblclick", (e) => {
      const coord = e.coord;
      closeLoopIfNear(coord);
    });
  }

  // "핀으로 코스 표시" 버튼 클릭 시 지도 로드
  if (pinButton && mapWrapper) {
    pinButton.addEventListener("click", (event) => {
      event.preventDefault();
      initMap();   // 처음 한 번만 생성 + 버튼/배경 제거
    });
  }
});



// =============================
// Firebase 초기 설정 (v8)
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyAE8PH0DT_49EGAco6UozQ9WlnEZMxXy_M",
  authDomain: "day-by-run.firebaseapp.com",
  projectId: "day-by-run",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();


// =============================
// 태그 선택 상태 저장
// =============================
const selected = {
  districts: new Set(),  // 여러 개
  distance: null,        // 숫자 (2,3,5,10,15)
  slope: null,           // "FLAT" / "HILLY"
  scenery: null,         // "NATURE" / "CITY" / "MIXED"
};

const SELECTED_CLASS = "selected";

// 1) 지역: 여러 개 선택 가능
document.querySelectorAll(".tag-district").forEach(btn => {
  btn.addEventListener("click", () => {
    const code = btn.dataset.code; // "YONGSAN" 이런 코드

    if (btn.classList.contains(SELECTED_CLASS)) {
      btn.classList.remove(SELECTED_CLASS);
      selected.districts.delete(code);
    } else {
      btn.classList.add(SELECTED_CLASS);
      selected.districts.add(code);
    }
  });
});

// 2) 거리: 1개만 선택
const distanceBtns = document.querySelectorAll(".tag-distance");
distanceBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const value = Number(btn.dataset.value); // 2,3,5,10,15

    if (selected.distance === value) {
      selected.distance = null;
      btn.classList.remove(SELECTED_CLASS);
      return;
    }

    selected.distance = value;
    distanceBtns.forEach(b => b.classList.remove(SELECTED_CLASS));
    btn.classList.add(SELECTED_CLASS);
  });
});

// 3) 경사: 1개만 선택
const slopeBtns = document.querySelectorAll(".tag-slope");
slopeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const code = btn.dataset.code; // "FLAT" / "HILLY"

    if (selected.slope === code) {
      selected.slope = null;
      btn.classList.remove(SELECTED_CLASS);
      return;
    }

    selected.slope = code;
    slopeBtns.forEach(b => b.classList.remove(SELECTED_CLASS));
    btn.classList.add(SELECTED_CLASS);
  });
});

// 4) 분위기: 1개만 선택
const sceneryBtns = document.querySelectorAll(".tag-scenery");
sceneryBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const code = btn.dataset.code; // "NATURE" / "CITY" / "MIXED"

    if (selected.scenery === code) {
      selected.scenery = null;
      btn.classList.remove(SELECTED_CLASS);
      return;
    }

    selected.scenery = code;
    sceneryBtns.forEach(b => b.classList.remove(SELECTED_CLASS));
    btn.classList.add(SELECTED_CLASS);
  });
});


// =============================
// 업로드 버튼 → Firestore 저장
// =============================
const titleInput = document.getElementById("titleInput");
const descInput  = document.getElementById("descInput");
const uploadBtn  = document.getElementById("uploadBtn");

// pathPoints → Firestore용 좌표 배열로 변환
function getCoordinatesForUpload() {
  return pathPoints.map(p => {
    const c = p.coord;
    return {
      lat: c.y,  // naver.maps.LatLng: (y=위도, x=경도)
      lng: c.x
    };
  });
}

uploadBtn.addEventListener("click", async () => {
  if (uploadBtn.disabled) return;   // 혹시 모를 중복 클릭 방어
  uploadBtn.disabled = true;
  uploadBtn.style.opacity = "0.5";

  try {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const coordinates = getCoordinatesForUpload();

    // 검증
    if (!title) {
      alert("제목을 입력해 주세요.");
      uploadBtn.disabled = false;
      uploadBtn.style.opacity = "1";
      return;
    }
    if (!description) {
      alert("코스 설명을 입력해 주세요.");
      uploadBtn.disabled = false;
      uploadBtn.style.opacity = "1";
      return;
    }
    if (!coordinates || coordinates.length === 0) {
      alert("지도를 클릭해서 코스를 먼저 그려 주세요.");
      uploadBtn.disabled = false;
      uploadBtn.style.opacity = "1";
      return;
    }
    if (selected.districts.size === 0) {
      alert("지역을 하나 이상 선택해 주세요.");
      uploadBtn.disabled = false;
      uploadBtn.style.opacity = "1";
      return;
    }
    if (!selected.distance || !selected.slope || !selected.scenery) {
      alert("거리 / 경사 / 분위기 태그를 모두 선택해 주세요.");
      uploadBtn.disabled = false;
      uploadBtn.style.opacity = "1";
      return;
    }

    const payload = {
      title,
      description,
      coordinates,                        // [{lat:..., lng:...}, ...]
      district: Array.from(selected.districts), // ["YONGSAN","SEOCHO",...]
      distance: selected.distance,        // 2 / 3 / 5 / 10 / 15
      slope: selected.slope,              // "FLAT"
      scenery: selected.scenery,          // "NATURE"
      type: "user",                       // 🔥 유저 업로드
      likeCount: 0,
      saveCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("runCourses").add(payload);
    console.log("업로드 완료, id:", docRef.id);

    // ✅ 업로드 성공 모달 띄우기
    document.getElementById("uploadSuccessModal").classList.remove("hidden");
    // 여기서는 어차피 홈으로 가거나 머물 거라 버튼 다시 켜줄 필요 X

  } catch (err) {
    console.error("업로드 실패:", err);
    alert("업로드 중 오류가 발생했습니다. 콘솔을 확인해 주세요.");

    // 실패 시 다시 활성화
    uploadBtn.disabled = false;
    uploadBtn.style.opacity = "1";
  }
});

// 🔥 업로드 성공 모달의 "홈으로 이동" 버튼 이벤트
document.getElementById("goHomeBtn").addEventListener("click", () => {
  window.location.href = "main home.html"; // 원하는 홈 경로로 수정 가능
});
