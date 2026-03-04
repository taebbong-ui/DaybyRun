// ------------------------------
// Firebase 초기 설정 (v8)
// ------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAE8PH0DT_49EGAco6UozQ9WlnEZMxXy_M",
  authDomain: "day-by-run.firebaseapp.com",
  projectId: "day-by-run",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ------------------------------
// URL 파라미터 파싱
// ------------------------------
const params  = new URLSearchParams(location.search);
const courseId = params.get("id");
const from     = params.get("from") || "";     // "search" / "main" / "popular" ...
const keyword  = params.get("keyword") || "";  // 검색어 (없으면 빈 문자열)

console.log("선택된 코스 id:", courseId, "from:", from, "keyword:", keyword);

// detail 에서 comment/music 으로 넘어갈 때 같이 달고 갈 공통 쿼리
const extraParams = new URLSearchParams();
if (courseId) extraParams.set("id", courseId);
if (from)     extraParams.set("from", from);
if (keyword)  extraParams.set("keyword", keyword);
const extraQuery = extraParams.toString() ? `?${extraParams.toString()}` : "";

// ------------------------------
// comment / music 링크 세팅
// ------------------------------
const musicLink   = document.querySelector(".music-btn");
if (musicLink && courseId) {
  musicLink.href = `music.html${extraQuery}`;
}

const commentLink = document.querySelector(".comment-btn");
if (commentLink && courseId) {
  commentLink.href = `comment.html${extraQuery}`;
}

// ------------------------------
// 🔙 "이전" 버튼 (backBtn) 처리
// ------------------------------
const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // from 값 기준으로 "처음 코스를 클릭했던 페이지" 로 바로 이동
    if (from === "search") {
      const qs = new URLSearchParams();
      if (keyword) qs.set("keyword", keyword);   // 검색어 복원
      const qstr = qs.toString();
      window.location.href = qstr
        ? `search.html?${qstr}`
        : `search.html`;
      return;
    }

    if (from === "main") {
      window.location.href = "main home.html";
      return;
    }

    if (from === "popular") {
      window.location.href = "popular.html";
      return;
    }

    // 혹시 모를 예외 (직접 URL로 들어온 경우 등)
    window.location.href = "main home.html";
  });
}


if (!courseId) {
  console.error("코스 id가 없습니다. URL을 확인하세요.");
}

// 🔹 이걸로만 사용 (routeId 필요 없음)
const docRef = db.collection("runCourses").doc(courseId);


// ------------------------------
// UI 요소
// ------------------------------
const titleEl = document.getElementById("title");
const descriptionEl = document.getElementById("description");

const likeBtn = document.getElementById("likeBtn");
const saveBtn = document.getElementById("saveBtn");

// 토글 상태 (Firestore 저장용 아님)
let isLiked = false;
let isSaved = false;

// ------------------------------
// Firestore에서 문서 불러오기
// ------------------------------
docRef.get().then(doc => {
  if (!doc.exists) {
    console.error("문서 없음!");
    return;
  }

  const data = doc.data();

  // 제목/설명만 UI 업데이트
  titleEl.textContent = data.title;
  descriptionEl.textContent = data.description;

  // 🔹 태그 데이터 세팅 (enum → 한글 라벨)
  const locEl   = document.getElementById("tagLocation");
  const distEl  = document.getElementById("tagDistance");
  const slopeEl = document.getElementById("tagSlope");
  const natEl   = document.getElementById("tagNature");

  // 1) district: ["YONGSAN", "SEOCHO"] → "용산구 · 서초구"
  locEl.textContent = TagConfig.formatDistricts(data.district || []);

  // 2) distance: 2/3/5/10/15 → "3km- / 3km / 5km / 10km / 10km+"
  distEl.textContent = TagConfig.formatDistanceKm(data.distance);

  // 3) slope: "FLAT" / "HILLY" → "평지 위주" / "오르막 위주"
  slopeEl.textContent = TagConfig.formatSlope(data.slope);

  // 4) scenery: "NATURE" / "CITY" / "MIXED" → "자연 속" / "도심 속" / "자연과 도심 속"
  natEl.textContent = TagConfig.formatScenery(data.scenery);


  // 🔥 숫자 채우기
  document.getElementById("likeCount").textContent = data.likeCount ?? 0;
  document.getElementById("saveCount").textContent = data.saveCount ?? 0;

  // 초기 아이콘 설정
  likeBtn.src = "./element/course detail/SVG/button.svg";
  saveBtn.src = "./element/course detail/SVG/button (2).svg";
  // 🔹 여기 추가!
  drawCourseMap(data.coordinates || []);
});


// ------------------------------
// ❤️ 좋아요 토글 (화면 숫자 갱신 없음)
// ------------------------------
likeBtn.addEventListener("click", async () => {
  isLiked = !isLiked;
  const diff = isLiked ? 1 : -1;

  // 아이콘만 변경
  likeBtn.src = isLiked
    ? "./element/course detail/SVG/heartFill.svg"
    : "./element/course detail/SVG/button.svg";

  try {
    await docRef.update({
      likeCount: firebase.firestore.FieldValue.increment(diff),
    });
    // 🔥 UI 숫자 업데이트
    const span = document.getElementById("likeCount");
    span.textContent = Number(span.textContent) + diff;
    console.log("likeCount 업데이트:", diff);
  } catch (e) {
    console.error("likeCount 업데이트 실패:", e);
  }
});

// ------------------------------
// 📌 저장 토글 (화면 숫자 갱신 없음)
// ------------------------------
saveBtn.addEventListener("click", async () => {
  isSaved = !isSaved;
  const diff = isSaved ? 1 : -1;

  saveBtn.src = isSaved
    ? "./element/course detail/SVG/saveFill.svg"
    : "./element/course detail/SVG/button (2).svg";

  try {
    await docRef.update({
      saveCount: firebase.firestore.FieldValue.increment(diff),
    });
    // 🔥 UI 숫자 업데이트
    const span = document.getElementById("saveCount");
    span.textContent = Number(span.textContent) + diff;
    console.log("saveCount 업데이트:", diff);
  } catch (e) {
    console.error("saveCount 업데이트 실패:", e);
  }
});

// ------------------------------
// 네이버 지도에 경로 그리기 (선만 살짝 안쪽으로)
// ------------------------------
function drawCourseMap(coords) {
  if (!Array.isArray(coords) || coords.length === 0) return;
  if (typeof naver === "undefined" || !naver.maps) return;

  const mapDiv = document.getElementById("courseMap");
  if (!mapDiv) return;

  // 1) 원본 LatLng 배열
  const rawLatLng = coords.map(c => new naver.maps.LatLng(c.lat, c.lng));

  // 2) 지도 생성 (대충 첫 점 기준)
  const map = new naver.maps.Map(mapDiv, {
    center: rawLatLng[0],
    zoom: 14
  });

  // 3) 원본 기준 bounds 계산 (지도는 원래 범위 기준으로 맞춤)
  const bounds = new naver.maps.LatLngBounds();
  rawLatLng.forEach(ll => bounds.extend(ll));
  map.fitBounds(bounds);

  // 4) 중심점 구하기
  let sumLat = 0, sumLng = 0;
  rawLatLng.forEach(ll => {
    sumLat += ll.lat();
    sumLng += ll.lng();
  });
  const centerLat = sumLat / rawLatLng.length;
  const centerLng = sumLng / rawLatLng.length;

  // 5) 중심 기준으로 살짝 안쪽으로 스케일링 (0.9 = 10% 안쪽)
  const scale = 0.9;  // 더 안쪽으로 넣고 싶으면 0.85, 0.8 등으로 줄여도 됨
  const innerLatLng = rawLatLng.map(ll => {
    const newLat = centerLat + (ll.lat() - centerLat) * scale;
    const newLng = centerLng + (ll.lng() - centerLng) * scale;
    return new naver.maps.LatLng(newLat, newLng);
  });

  // 6) 스케일된 경로로 Polyline 그리기
  new naver.maps.Polyline({
    map,
    path: innerLatLng,
    strokeColor: "#5BBE3B",
    strokeOpacity: 1,
    strokeWeight: 5
  });
  // ----- 모든 좌표에 핀 표시 -----
innerLatLng.forEach(ll => {
  new naver.maps.Marker({
    position: ll,
    map: map,
    icon: {
      content: `
        <div style="
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ccac84;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        "></div>
      `,
      anchor: new naver.maps.Point(6, 6) 
    }
  });
});

  // 7) fitBounds 한 번 더 (혹시 모를 오차 보정용, 없어도 됨)
  map.fitBounds(bounds);
}
