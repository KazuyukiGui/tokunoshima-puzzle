// 徳之島 集落マスタ（公式集落区分ベース: 徳之島町26/天城町11/伊仙町20 = 57カード）
// 集落一覧の出典: 徳之島町 集落別人口表(30集落)・伊仙町公式(31集落を20地域に統合)・Wikipedia天城町(11大字)
//   徳之島町は 亀津=南区+中区+北区+東区 / 大原=大原1+大原2 の統合で30→26。
//   母間・花徳・山は大字名（行政区は池間/反川/大当/花時名・前川/新村/上花徳・港川/内千川/山里/畦）のためカードにしない
// 座標: OSM placeノード・国土地理院AddressSearch・国勢調査境界図形中心(e-Stat/Geoshape)・施設位置から
//       WGS84経緯度を取得し、map-paths.js と同じ正距円筒投影で viewBox(0 0 100 157.5) に変換。
//       操作性のため近接集落のみ最小間隔4.0(約640m)まで押し広げるデフォルメあり
// approx: true は公的座標が無く周辺情報から推定した集落（現在は上晴のみ）
// note: 正解時に表示する1行の特徴。出典・注記は village-notes-draft.md が正本。
//       無い集落（内千川・山里）は表示なしにフォールバックする
const TOWNS = {
  isen: "伊仙町",
  amagi: "天城町",
  tokunoshima: "徳之島町",
  all: "全島",
};

const VILLAGES = [
  // ===== 徳之島町 =====
  { id: "tete", name: "手々", kana: "てて", town: "tokunoshima", x: 36.0, y: 9.0 , note: "盆に白装束で練り歩く伝統行事「むちたぼり」" },
  { id: "kanami", name: "金見", kana: "かなみ", town: "tokunoshima", x: 54.3, y: 8.1 , note: "防風のソテツが約200mのトンネルになった岬の里" },
  { id: "minatogawa", name: "港川", kana: "みなとがわ", town: "tokunoshima", x: 48.3, y: 24.5 , note: "魚を網に追い込む伝統漁「漁なくさみ」の里" },
  { id: "sansato", name: "山里", kana: "さんさと", town: "tokunoshima", x: 41.6, y: 22.8 },
  { id: "uchikawa", name: "内千川", kana: "うちかわ", town: "tokunoshima", x: 51.2, y: 21.5 },
  { id: "aze", name: "畦", kana: "あぜ", town: "tokunoshima", x: 53.1, y: 36.1 , note: "白砂が約1.5km続く畦プリンスビーチの里" },
  { id: "todoroki", name: "轟木", kana: "とどろき", town: "tokunoshima", x: 38.7, y: 43.1 , note: "三方を山に囲まれ万田川が流れる自然豊かな里" },
  { id: "maekawa", name: "前川", kana: "まえかわ", town: "tokunoshima", x: 45.3, y: 56.5 , note: "殿地屋敷跡が残る花徳三地区の一つ" },
  { id: "uekedoku", name: "上花徳", kana: "うえけどく", town: "tokunoshima", x: 42.3, y: 49.8 , note: "弥生前期の遺跡が見つかった高台「サト」の里" },
  { id: "kedokina", name: "花時名", kana: "けどきな", town: "tokunoshima", x: 59.1, y: 65.5 , note: "展望台から里久浜と集落を一望" },
  { id: "shinmura", name: "新村", kana: "しんむら", town: "tokunoshima", x: 53.7, y: 48.4 , note: "花徳三地区のうち海岸沿いに家並みが広がる" },
  { id: "tankawa", name: "反川", kana: "たんかわ", town: "tokunoshima", x: 64.7, y: 62.1 , note: "トゥール墓で祖霊祭を続ける集落" },
  { id: "oatari", name: "大当", kana: "おおあたり", town: "tokunoshima", x: 62.5, y: 58.5 , note: "約170本のヒカンザクラが彩る桜並木の里" },
  { id: "ikema", name: "池間", kana: "いけま", town: "tokunoshima", x: 68.8, y: 62.5 , note: "町指定文化財「池間棒踊り」を受け継ぐ" },
  { id: "shimokushi", name: "下久志", kana: "しもくし", town: "tokunoshima", x: 72.9, y: 64.7 , note: "十五夜に茅葺き小屋「サンシキ」で相撲と踊り" },
  { id: "inokawa", name: "井之川", kana: "いのかわ", town: "tokunoshima", x: 80.0, y: 77.7 , note: "第46代横綱・朝潮太郎の生誕地。記念像が立つ" },
  { id: "asahigaoka", name: "旭ケ丘", kana: "あさひがおか", town: "tokunoshima", x: 76.8, y: 75.3 , note: "昭和30年代、井之川岳の麓に入植で生まれた里" },
  { id: "shoda", name: "諸田", kana: "しょだ", town: "tokunoshima", x: 86.9, y: 87.2 , note: "渡り鳥が集う野鳥観察の名所・諸田池" },
  { id: "kaminomine", name: "神之嶺", kana: "かみのみね", town: "tokunoshima", x: 86.9, y: 82.1 , note: "神之嶺小学校の敷地に保育所を併設する学びの里" },
  { id: "tokuwase", name: "徳和瀬", kana: "とくわせ", town: "tokunoshima", x: 89.7, y: 90.0 , note: "12歳以下の子どもが約2倍に増えた子育ての里" },
  { id: "kametoku", name: "亀徳", kana: "かめとく", town: "tokunoshima", x: 85.8, y: 99.4 , note: "水を掛け合う正月行事「ネンケ」が伝わる港の里" },
  { id: "kametsu", name: "亀津", kana: "かめつ", town: "tokunoshima", x: 77.2, y: 113.4 , note: "薩摩藩代官所跡が残り「学士村」と呼ばれた中心地" },
  { id: "shirai", name: "白井", kana: "しらい", town: "tokunoshima", x: 53.3, y: 106.2 , note: "目手久の人々が移り住み生まれたと伝わる里" },
  { id: "ohara", name: "大原", kana: "おおはら", town: "tokunoshima", x: 60.5, y: 102.2 , note: "昭和30年代に約40戸の入植者が拓いた農業集落" },
  { id: "nanbaru", name: "南原", kana: "なんばる", town: "tokunoshima", x: 74.2, y: 123.6 , note: "徳之島町最南端に位置する海岸沿いの集落" },
  { id: "omo", name: "尾母", kana: "おも", town: "tokunoshima", x: 67.4, y: 117.8 , note: "松明を掲げて踊る伝統行事「アキムチ」の里" },

  // ===== 天城町 =====
  { id: "yonama", name: "与名間", kana: "よなま", town: "amagi", x: 16.3, y: 17.5 , note: "高橋尚子選手が走った尚子ロードと与名間ビーチ" },
  { id: "matsubara", name: "松原", kana: "まつばら", town: "amagi", x: 16.9, y: 32.2 , note: "歓迎闘牛が開かれる松原闘牛場がある集落" },
  { id: "amagi", name: "天城", kana: "あまぎ", town: "amagi", x: 18.3, y: 55.6 , note: "島の歴史と「ユイ」の心を伝える町立ユイの館" },
  { id: "okazen", name: "岡前", kana: "おかぜん", town: "amagi", x: 15.1, y: 37.6 , note: "西郷隆盛の謫居跡と岡前西郷公園が残る" },
  { id: "hetono", name: "平土野", kana: "へとの", town: "amagi", x: 14.9, y: 57.7 , note: "天城町役場と商店街が集まる町の中心地" },
  { id: "asama", name: "浅間", kana: "あさま", town: "amagi", x: 12.0, y: 44.3 , note: "徳之島子宝空港と海につながる水中洞窟ウンブキ" },
  { id: "kaneku", name: "兼久", kana: "かねく", town: "amagi", x: 26.0, y: 65.9 , note: "奇岩と海食崖が連なる景勝地「犬の門蓋」" },
  { id: "setaki", name: "瀬滝", kana: "せたき", town: "amagi", x: 24.8, y: 76.9 , note: "船や弓矢を岩に刻んだ希少な「戸森の線刻画」" },
  { id: "tobe", name: "当部", kana: "とうべ", town: "amagi", x: 36.5, y: 70.0 , note: "「クロウサギの里」。島一番と言われる湧き水も" },
  { id: "otsukawa", name: "大津川", kana: "おおつかわ", town: "amagi", x: 19.2, y: 71.0 , note: "ウミガメが訪れる千間海岸へ下る集落" },
  { id: "nishiagina", name: "西阿木名", kana: "にしあぎな", town: "amagi", x: 32.1, y: 88.2 , note: "奄美群島最古級の土器が出た下原洞穴遺跡" },

  // ===== 伊仙町 =====
  { id: "inutabu", name: "犬田布", kana: "いぬたぶ", town: "isen", x: 18.2, y: 118.0 , note: "断崖の景勝地・犬田布岬を望む、海と暮らす里" },
  { id: "kinoko", name: "木之香", kana: "きのこ", town: "isen", x: 24.1, y: 120.9 , note: "かつて世界最高齢と認定された本郷かまとさんの故郷" },
  { id: "asan-shikaura", name: "阿三・鹿浦", kana: "あさん・しかうら", town: "isen", x: 32.9, y: 133.4 , note: "長寿世界一とされた泉重千代翁の故郷。カムィヤキ窯跡も" },
  { id: "agon", name: "阿権", kana: "あごん", town: "isen", x: 29.2, y: 124.5 , note: "石垣の里。樹齢約300年のガジュマルと石垣の家並み" },
  { id: "kawachi", name: "河地", kana: "かわち", town: "isen", x: 29.6, y: 105.4 , note: "県道沿いの無人市場が地域の人々に人気" },
  { id: "sagibaru", name: "崎原", kana: "さぎばる", town: "isen", x: 22.2, y: 110.2 , note: "池の台公園から晴れた日は沖永良部島を望む" },
  { id: "kojima", name: "小島", kana: "こじま", town: "isen", x: 23.5, y: 99.1 , note: "小原海岸の温かな潮だまりはかつての湯治場" },
  { id: "itokina", name: "糸木名", kana: "いときな", town: "isen", x: 32.9, y: 107.6 , note: "二つの県道が交わる町北部の集落" },
  { id: "bane", name: "馬根", kana: "ばね", town: "isen", x: 42.4, y: 119.7 , note: "山々に囲まれ伊仙中部ダムを抱く集落" },
  { id: "uebaru", name: "上晴", kana: "うえばる", town: "isen", x: 25.8, y: 112.1, approx: true , note: "高齢者の地域サロン活動が盛んな集落" },
  { id: "nakayama", name: "中山", kana: "なかやま", town: "isen", x: 48.3, y: 119.1 , note: "町内最小の集落。田植え歌と踊りを受け継ぐ" },
  { id: "isen", name: "伊仙", kana: "いせん", town: "isen", x: 39.2, y: 146.5 , note: "町役場や主要施設が集まる伊仙町の中心地" },
  { id: "kenbuku", name: "検福", kana: "けんぶく", town: "isen", x: 47.3, y: 144.9 , note: "商店やゲストハウスがあり集落活動も活発" },
  { id: "gozendo", name: "御前堂", kana: "ごぜんどう", town: "isen", x: 41.2, y: 134.4 , note: "体育館やグラウンドを備えた義名山総合運動公園" },
  { id: "omonawa", name: "面縄", kana: "おもなわ", town: "isen", x: 54.7, y: 142.3 , note: "島最南端の海辺に縄文後期の面縄貝塚が残る" },
  { id: "furusato", name: "古里", kana: "ふるさと", town: "isen", x: 47.3, y: 138.3 , note: "浜に面した数少ない集落。車の入れない細道が残る" },
  { id: "meteku", name: "目手久", kana: "めてぐ", town: "isen", x: 61.8, y: 140.1 , note: "島内最大の観光闘牛場がある闘牛どころ" },
  { id: "yaezo", name: "八重竿", kana: "やえぞう", town: "isen", x: 40.6, y: 111.8 , note: "県道沿いにほぼ実物大の闘牛模型が立つ" },
  { id: "saben", name: "佐弁", kana: "さべん", town: "isen", x: 65.4, y: 137.5 , note: "約2400年前のトマチン遺跡。人骨やヒスイが出土" },
  { id: "kinen", name: "喜念", kana: "きねん", town: "isen", x: 68.6, y: 135.1 , note: "約1kmの砂丘が続く喜念浜。夕方は闘牛の散歩も" },
];
