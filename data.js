// 徳之島 集落マスタ（公式集落区分ベース: 徳之島町26/天城町11/伊仙町20 = 57カード）
// 集落一覧の出典: 徳之島町 集落別人口表(30集落)・伊仙町公式(31集落を20地域に統合)・Wikipedia天城町(11大字)
//   徳之島町は 亀津=南区+中区+北区+東区 / 大原=大原1+大原2 の統合で30→26。
//   母間・花徳・山は大字名（行政区は池間/反川/大当/花時名・前川/新村/上花徳・港川/内千川/山里/畦）のためカードにしない
// 座標: OSM placeノード・国土地理院AddressSearch・国勢調査境界図形中心(e-Stat/Geoshape)・施設位置から
//       WGS84経緯度を取得し、map-paths.js と同じ正距円筒投影で viewBox(0 0 100 157.5) に変換。
//       操作性のため近接集落のみ最小間隔4.0(約640m)まで押し広げるデフォルメあり
// approx: true は公的座標が無く周辺情報から推定した集落（現在は上晴のみ）
const TOWNS = {
  isen: "伊仙町",
  amagi: "天城町",
  tokunoshima: "徳之島町",
  all: "全島",
};

const VILLAGES = [
  // ===== 徳之島町 =====
  { id: "tete", name: "手々", kana: "てて", town: "tokunoshima", x: 36.0, y: 9.0 },
  { id: "kanami", name: "金見", kana: "かなみ", town: "tokunoshima", x: 54.3, y: 8.1 },
  { id: "minatogawa", name: "港川", kana: "みなとがわ", town: "tokunoshima", x: 48.3, y: 24.5 },
  { id: "sansato", name: "山里", kana: "さんさと", town: "tokunoshima", x: 41.6, y: 22.8 },
  { id: "uchikawa", name: "内千川", kana: "うちかわ", town: "tokunoshima", x: 51.2, y: 21.5 },
  { id: "aze", name: "畦", kana: "あぜ", town: "tokunoshima", x: 53.1, y: 36.1 },
  { id: "todoroki", name: "轟木", kana: "とどろき", town: "tokunoshima", x: 38.7, y: 43.1 },
  { id: "maekawa", name: "前川", kana: "まえかわ", town: "tokunoshima", x: 45.3, y: 56.5 },
  { id: "uekedoku", name: "上花徳", kana: "うえけどく", town: "tokunoshima", x: 42.3, y: 49.8 },
  { id: "kedokina", name: "花時名", kana: "けどきな", town: "tokunoshima", x: 59.1, y: 65.5 },
  { id: "shinmura", name: "新村", kana: "しんむら", town: "tokunoshima", x: 53.7, y: 48.4 },
  { id: "tankawa", name: "反川", kana: "たんかわ", town: "tokunoshima", x: 64.7, y: 62.1 },
  { id: "oatari", name: "大当", kana: "おおあたり", town: "tokunoshima", x: 62.5, y: 58.5 },
  { id: "ikema", name: "池間", kana: "いけま", town: "tokunoshima", x: 68.8, y: 62.5 },
  { id: "shimokushi", name: "下久志", kana: "しもくし", town: "tokunoshima", x: 72.9, y: 64.7 },
  { id: "inokawa", name: "井之川", kana: "いのかわ", town: "tokunoshima", x: 80.0, y: 77.7 },
  { id: "asahigaoka", name: "旭ケ丘", kana: "あさひがおか", town: "tokunoshima", x: 76.8, y: 75.3 },
  { id: "shoda", name: "諸田", kana: "しょだ", town: "tokunoshima", x: 86.9, y: 87.2 },
  { id: "kaminomine", name: "神之嶺", kana: "かみのみね", town: "tokunoshima", x: 86.9, y: 82.1 },
  { id: "tokuwase", name: "徳和瀬", kana: "とくわせ", town: "tokunoshima", x: 89.7, y: 90.0 },
  { id: "kametoku", name: "亀徳", kana: "かめとく", town: "tokunoshima", x: 85.8, y: 99.4 },
  { id: "kametsu", name: "亀津", kana: "かめつ", town: "tokunoshima", x: 77.2, y: 113.4 },
  { id: "shirai", name: "白井", kana: "しらい", town: "tokunoshima", x: 53.3, y: 106.2 },
  { id: "ohara", name: "大原", kana: "おおはら", town: "tokunoshima", x: 60.5, y: 102.2 },
  { id: "nanbaru", name: "南原", kana: "なんばる", town: "tokunoshima", x: 74.2, y: 123.6 },
  { id: "omo", name: "尾母", kana: "おも", town: "tokunoshima", x: 67.4, y: 117.8 },

  // ===== 天城町 =====
  { id: "yonama", name: "与名間", kana: "よなま", town: "amagi", x: 16.3, y: 17.5 },
  { id: "matsubara", name: "松原", kana: "まつばら", town: "amagi", x: 16.9, y: 32.2 },
  { id: "amagi", name: "天城", kana: "あまぎ", town: "amagi", x: 18.3, y: 55.6 },
  { id: "okazen", name: "岡前", kana: "おかぜん", town: "amagi", x: 15.1, y: 37.6 },
  { id: "hetono", name: "平土野", kana: "へとの", town: "amagi", x: 14.9, y: 57.7 },
  { id: "asama", name: "浅間", kana: "あさま", town: "amagi", x: 12.0, y: 44.3 },
  { id: "kaneku", name: "兼久", kana: "かねく", town: "amagi", x: 26.0, y: 65.9 },
  { id: "setaki", name: "瀬滝", kana: "せたき", town: "amagi", x: 24.8, y: 76.9 },
  { id: "tobe", name: "当部", kana: "とうべ", town: "amagi", x: 36.5, y: 70.0 },
  { id: "otsukawa", name: "大津川", kana: "おおつかわ", town: "amagi", x: 19.2, y: 71.0 },
  { id: "nishiagina", name: "西阿木名", kana: "にしあぎな", town: "amagi", x: 32.1, y: 88.2 },

  // ===== 伊仙町 =====
  { id: "inutabu", name: "犬田布", kana: "いぬたぶ", town: "isen", x: 18.2, y: 118.0 },
  { id: "kinoko", name: "木之香", kana: "きのこ", town: "isen", x: 24.1, y: 120.9 },
  { id: "asan-shikaura", name: "阿三・鹿浦", kana: "あさん・しかうら", town: "isen", x: 32.9, y: 133.4 },
  { id: "agon", name: "阿権", kana: "あごん", town: "isen", x: 29.2, y: 124.5 },
  { id: "kawachi", name: "河地", kana: "かわち", town: "isen", x: 29.6, y: 105.4 },
  { id: "sagibaru", name: "崎原", kana: "さぎばる", town: "isen", x: 22.2, y: 110.2 },
  { id: "kojima", name: "小島", kana: "こじま", town: "isen", x: 23.5, y: 99.1 },
  { id: "itokina", name: "糸木名", kana: "いときな", town: "isen", x: 32.9, y: 107.6 },
  { id: "bane", name: "馬根", kana: "ばね", town: "isen", x: 42.4, y: 119.7 },
  { id: "uebaru", name: "上晴", kana: "うえばる", town: "isen", x: 25.8, y: 112.1, approx: true },
  { id: "nakayama", name: "中山", kana: "なかやま", town: "isen", x: 48.3, y: 119.1 },
  { id: "isen", name: "伊仙", kana: "いせん", town: "isen", x: 39.2, y: 146.5 },
  { id: "kenbuku", name: "検福", kana: "けんぶく", town: "isen", x: 47.3, y: 144.9 },
  { id: "gozendo", name: "御前堂", kana: "ごぜんどう", town: "isen", x: 41.2, y: 134.4 },
  { id: "omonawa", name: "面縄", kana: "おもなわ", town: "isen", x: 54.7, y: 142.3 },
  { id: "furusato", name: "古里", kana: "ふるさと", town: "isen", x: 47.3, y: 138.3 },
  { id: "meteku", name: "目手久", kana: "めてぐ", town: "isen", x: 61.8, y: 140.1 },
  { id: "yaezo", name: "八重竿", kana: "やえぞう", town: "isen", x: 40.6, y: 111.8 },
  { id: "saben", name: "佐弁", kana: "さべん", town: "isen", x: 65.4, y: 137.5 },
  { id: "kinen", name: "喜念", kana: "きねん", town: "isen", x: 68.6, y: 135.1 },
];
