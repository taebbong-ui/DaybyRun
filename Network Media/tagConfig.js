// ====== enum → 사람이 읽는 라벨 매핑 ======

// 1) 자치구 코드 → 한글 이름
const DISTRICT_LABELS = {
  GANGNAM: "강남구",
  GANGDONG: "강동구",
  GANGBUK: "강북구",
  GANGSEO: "강서구",
  GWANAK: "관악구",
  GWANGJIN: "광진구",
  GURO: "구로구",
  GEUMCHEON: "금천구",
  NOWON: "노원구",
  DOBONG: "도봉구",
  DONGDAEMUN: "동대문구",
  DONGJAK: "동작구",
  MAPO: "마포구",
  SEODAEMUN: "서대문구",
  SEOCHO: "서초구",
  SEONGDONG: "성동구",
  SEONGBUK: "성북구",
  SONGPA: "송파구",
  YANGCHEON: "양천구",
  YEONGDEUNGPO: "영등포구",
  YONGSAN: "용산구",
  EUNPYEONG: "은평구",
  JONGNO: "종로구",
  JUNG: "중구",
  JUNGRANG: "중랑구"
};

// 2) 경사도 코드 → 한글
const SLOPE_LABELS = {
  FLAT: "평지 위주",
  HILLY: "오르막 위주"
  // 필요하면 더 추가
};

// 3) 풍경/분위기 코드 → 한글
const SCENERY_LABELS = {
  NATURE: "자연 속",
  CITY: "도심 속",
  MIXED: "자연과 도심 속"
};

// ====== distance 매핑 ======
const DISTANCE_LABELS = {
  2:  "3km-",   // 2 이하
  3:  "3km",
  5:  "5km",
  10: "10km",
  15: "10km+"  // 10km 이상
};

// ====== 공용 포맷 함수 ======

// ["YONGSAN", "SEOCHO"] → "용산구 · 서초구"
function formatDistricts(districtArray) {
  if (!Array.isArray(districtArray)) return "";
  return districtArray
    .map(code => DISTRICT_LABELS[code] || code)
    .join(" · ");
}

// 10 → "10km"
function formatDistanceKm(distance) {
  if (distance == null) return "";
  return `${distance}km`;
}

// "FLAT" → "평지 위주"
function formatSlope(code) {
  return SLOPE_LABELS[code] || "";
}

// "NATURE" → "자연 속"
function formatScenery(code) {
  return SCENERY_LABELS[code] || "";
}

// 거리 숫자 → 라벨 변환
function formatDistanceKm(num) {
  if (num == null) return "";

  // 정확히 매칭되는 값이면 그대로 반환
  if (DISTANCE_LABELS[num]) return DISTANCE_LABELS[num];

  // 예외 케이스: 10km 이상은 전부 10km+
  if (num > 10) return DISTANCE_LABELS[15];

  // 예외 케이스: 2km 이하라면 3km-
  if (num <= 2) return DISTANCE_LABELS[2];

  return `${num}km`; // 혹시 매핑 밖 값이 오더라도 fallback
}

window.TagConfig = {
  DISTRICT_LABELS,
  SLOPE_LABELS,
  SCENERY_LABELS,
  DISTANCE_LABELS,
  formatDistricts,
  formatDistanceKm,
  formatSlope,
  formatScenery,
};